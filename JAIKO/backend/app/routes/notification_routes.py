# notification_routes.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Notification
from ..services.notification_service import send_notification  # Importamos la función modificada

notification_bp = Blueprint("notifications", __name__)


@notification_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifs = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    unread = sum(1 for n in notifs if not n.read)
    return jsonify({"notifications": [n.to_dict() for n in notifs], "unread": unread}), 200


@notification_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    notif.read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, read=False).update({"read": True})
    db.session.commit()
    return jsonify({"message": "All marked as read"}), 200


# NUEVO: ruta de ejemplo para enviar una notificación manual (opcional)
@notification_bp.route("/send-test", methods=["POST"])
@jwt_required()
def send_test_notification():
    """
    Esta ruta es opcional para probar que send_notification guarda la notificación en la DB.
    """
    user_id = int(get_jwt_identity())
    send_notification(
        user_id=user_id,
        type="system",
        title="Prueba de notificación",
        content="Esta es una notificación de prueba",
        data={"example": True},
    )
    return jsonify({"message": "Notificación de prueba enviada"}), 200