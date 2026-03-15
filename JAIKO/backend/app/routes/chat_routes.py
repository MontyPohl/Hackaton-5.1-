from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Chat, ChatMember, Message, User

chat_bp = Blueprint("chats", __name__)


@chat_bp.route("/", methods=["GET"])
@jwt_required()
def get_my_chats():
    user_id = int(get_jwt_identity())
    memberships = ChatMember.query.filter_by(user_id=user_id).all()
    chats = []
    for m in memberships:
        chat_data = m.chat.to_dict(user_id=user_id)
        chats.append(chat_data)
    # Sort by last message
    chats.sort(key=lambda c: c.get("last_message", {}).get("created_at", "") if c.get("last_message") else "", reverse=True)
    return jsonify({"chats": chats}), 200


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
