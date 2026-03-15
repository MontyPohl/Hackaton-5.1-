from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import RoommateRequest, Chat, ChatMember, GroupMember
from ..services.notification_service import send_notification

request_bp = Blueprint("requests", __name__)


@request_bp.route("/", methods=["POST"])
@jwt_required()
def create_request():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    req_type = data.get("type", "roommate")
    target   = data.get("target_user_id")
    group_id = data.get("group_id")
    listing_id = data.get("listing_id")

    if not target and not group_id and not listing_id:
        return jsonify({"error": "target_user_id, group_id, or listing_id required"}), 400

    # Check duplicate
    existing = RoommateRequest.query.filter_by(
        sender_user_id=user_id,
        target_user_id=target,
        group_id=group_id,
        listing_id=listing_id,
        status="pending",
    ).first()
    if existing:
        return jsonify({"error": "Request already pending"}), 409

    req = RoommateRequest(
        sender_user_id=user_id,
        target_user_id=target,
        group_id=group_id,
        listing_id=listing_id,
        type=req_type,
        message=data.get("message"),
    )
    db.session.add(req)
    db.session.flush()

    # Notify target
    if target:
        send_notification(
            user_id=target,
            type="match_request",
            title="Nueva solicitud de roomie",
            content=f"Alguien quiere ser tu roomie",
            data={"request_id": req.id, "sender_id": user_id},
        )
    elif group_id:
        from ..models import Group
        grp = db.session.get(db.Model.__subclasses__(), group_id)

    db.session.commit()
    return jsonify({"request": req.to_dict()}), 201


@request_bp.route("/<int:req_id>/respond", methods=["PUT"])
@jwt_required()
def respond_request(req_id):
    user_id = int(get_jwt_identity())
    req     = RoommateRequest.query.get_or_404(req_id)
    data    = request.get_json()

    # Only target can respond
    if req.target_user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    action = data.get("action")  # accept | reject
    if action not in ("accept", "reject"):
        return jsonify({"error": "action must be accept or reject"}), 400

    req.status = "accepted" if action == "accept" else "rejected"

    if action == "accept" and req.type == "roommate":
        # Create a private chat between the two users
        existing_chat = (
            db.session.query(Chat)
            .join(ChatMember, ChatMember.chat_id == Chat.id)
            .filter(Chat.type == "private", ChatMember.user_id == req.sender_user_id)
            .filter(Chat.id.in_(
                db.session.query(ChatMember.chat_id).filter_by(user_id=user_id)
            ))
            .first()
        )
        if not existing_chat:
            chat = Chat(type="private")
            db.session.add(chat)
            db.session.flush()
            db.session.add(ChatMember(chat_id=chat.id, user_id=user_id))
            db.session.add(ChatMember(chat_id=chat.id, user_id=req.sender_user_id))

    # Notify sender of response
    send_notification(
        user_id=req.sender_user_id,
        type="match_request",
        title="Tu solicitud fue " + ("aceptada ✓" if action == "accept" else "rechazada"),
        content=None,
        data={"request_id": req.id},
    )

    db.session.commit()
    return jsonify({"request": req.to_dict()}), 200


@request_bp.route("/incoming", methods=["GET"])
@jwt_required()
def get_incoming():
    user_id = int(get_jwt_identity())
    reqs = (
        RoommateRequest.query
        .filter_by(target_user_id=user_id, status="pending")
        .order_by(RoommateRequest.created_at.desc())
        .all()
    )
    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200


@request_bp.route("/outgoing", methods=["GET"])
@jwt_required()
def get_outgoing():
    user_id = int(get_jwt_identity())
    reqs = (
        RoommateRequest.query
        .filter_by(sender_user_id=user_id)
        .order_by(RoommateRequest.created_at.desc())
        .all()
    )
    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200
