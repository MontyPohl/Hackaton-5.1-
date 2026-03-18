from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from ..extensions import db
from ..models import Chat, ChatMember, Message, User

chat_bp = Blueprint("chats", __name__)


@chat_bp.route("/", methods=["GET"])
@jwt_required()
def get_my_chats():
    user_id = int(get_jwt_identity())

    # 1 query: get chat IDs for this user
    chat_ids = [
        row.chat_id
        for row in db.session.query(ChatMember.chat_id).filter_by(user_id=user_id).all()
    ]
    if not chat_ids:
        return jsonify({"chats": []}), 200

    # 1 query: load chats + members + user profiles eagerly
    chats = (
        Chat.query
        .filter(Chat.id.in_(chat_ids))
        .options(
            joinedload(Chat.members).joinedload(ChatMember.user)
        )
        .all()
    )

    # 1 query: get last message per chat using MAX(id) subquery
    last_msg_subq = (
        db.session.query(func.max(Message.id))
        .filter(Message.chat_id.in_(chat_ids))
        .group_by(Message.chat_id)
        .subquery()
    )
    last_messages = (
        Message.query
        .filter(Message.id.in_(last_msg_subq))
        .options(joinedload(Message.sender))
        .all()
    )
    last_msg_by_chat = {m.chat_id: m for m in last_messages}

    result = []
    for chat in chats:
        last_msg = last_msg_by_chat.get(chat.id)
        result.append({
            "id": chat.id,
            "type": chat.type,
            "group_id": chat.group_id,
            "listing_id": chat.listing_id,
            "members": [m.to_dict() for m in chat.members],
            "last_message": last_msg.to_dict() if last_msg else None,
            "created_at": chat.created_at.isoformat(),
        })

    result.sort(
        key=lambda c: c["last_message"]["created_at"] if c.get("last_message") else "",
        reverse=True,
    )
    return jsonify({"chats": result}), 200


@chat_bp.route("/private/<int:other_user_id>", methods=["POST"])
@jwt_required()
def get_or_create_private_chat(other_user_id):
    """Get or create a private 1-on-1 chat."""
    user_id = int(get_jwt_identity())
    if user_id == other_user_id:
        return jsonify({"error": "Cannot chat with yourself"}), 400

    User.query.get_or_404(other_user_id)

    # Check if private chat already exists
    my_chats = (
        db.session.query(Chat.id)
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .filter(Chat.type == "private", ChatMember.user_id == user_id)
        .subquery()
    )
    existing = (
        Chat.query
        .filter(Chat.id.in_(my_chats))
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .filter(ChatMember.user_id == other_user_id)
        .first()
    )
    if existing:
        return jsonify({"chat": existing.to_dict()}), 200

    chat = Chat(type="private")
    db.session.add(chat)
    db.session.flush()
    db.session.add(ChatMember(chat_id=chat.id, user_id=user_id))
    db.session.add(ChatMember(chat_id=chat.id, user_id=other_user_id))
    db.session.commit()
    return jsonify({"chat": chat.to_dict()}), 201


@chat_bp.route("/<int:chat_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(chat_id):
    user_id = int(get_jwt_identity())
    member = ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "Not a member of this chat"}), 403

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))

    messages = (
        Message.query.filter_by(chat_id=chat_id)
        .order_by(Message.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    messages.reverse()
    return jsonify({"messages": [m.to_dict() for m in messages], "page": page}), 200
