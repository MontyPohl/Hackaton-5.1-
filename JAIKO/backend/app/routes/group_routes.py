from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Group, GroupMember, Chat, ChatMember
from ..services.notification_service import send_notification

group_bp = Blueprint("groups", __name__)


# --- Listar grupos ---
@group_bp.route("/", methods=["GET"])
@jwt_required()
def list_groups():
    city = request.args.get("city", "Asunción")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    q = Group.query.filter(Group.city == city, Group.status == "open")
    total = q.count()
    groups = (
        q.order_by(Group.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return (
        jsonify(
            {"groups": [g.to_dict() for g in groups], "total": total, "page": page}
        ),
        200,
    )


# --- Crear grupo ---
@group_bp.route("/", methods=["POST"])
@jwt_required()
def create_group():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get("name"):
        return jsonify({"error": "El nombre del grupo es requerido"}), 400

    max_members = max(2, min(int(data.get("max_members", 3)), 6))

    group = Group(
        name=data["name"],
        description=data.get("description"),
        city=data.get("city", "Asunción"),
        max_members=max_members,
        created_by=user_id,
        budget_max=data.get("budget_max"),
        pets_allowed=data.get("pets_allowed", False),
        smoking_allowed=data.get("smoking_allowed", False),
    )
    db.session.add(group)
    db.session.flush()

    # Creador entra como admin
    member = GroupMember(
        group_id=group.id, user_id=user_id, role="admin", status="active"
    )
    db.session.add(member)

    # Crear chat grupal
    chat = Chat(type="group", group_id=group.id)
    db.session.add(chat)
    db.session.flush()
    db.session.add(ChatMember(chat_id=chat.id, user_id=user_id))

    db.session.commit()
    return jsonify({"group": group.to_dict()}), 201


# --- Obtener grupo ---
@group_bp.route("/<int:group_id>", methods=["GET"])
@jwt_required()
def get_group(group_id):
    group = Group.query.get_or_404(group_id)
    group_data = group.to_dict()

    # Incluir solicitudes pendientes
    pending_members = GroupMember.query.filter_by(
        group_id=group_id, status="pending"
    ).all()
    group_data["join_requests"] = [
        {
            "id": m.id,
            "user": {
                "id": m.user_id,
                "profile": (
                    m.user.profile.to_dict() if m.user and m.user.profile else {}
                ),
            },
        }
        for m in pending_members
    ]
    return jsonify({"group": group_data}), 200


# --- Unirse directamente al grupo ---
@group_bp.route("/<int:group_id>/join", methods=["POST"])
@jwt_required()
def join_group(group_id):
    user_id = int(get_jwt_identity())
    group = Group.query.get_or_404(group_id)

    if group.is_full:
        return jsonify({"error": "El grupo está lleno"}), 400

    existing = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if existing and existing.status == "active":
        return jsonify({"error": "Ya sos miembro de este grupo"}), 400

    if existing:
        existing.status = "active"
    else:
        member = GroupMember(group_id=group_id, user_id=user_id, status="active")
        db.session.add(member)

    # Agregar al chat del grupo
    chat = Chat.query.filter_by(group_id=group_id).first()
    if chat:
        if not ChatMember.query.filter_by(chat_id=chat.id, user_id=user_id).first():
            db.session.add(ChatMember(chat_id=chat.id, user_id=user_id))

    if group.current_members + 1 >= group.max_members:
        group.status = "full"

    db.session.commit()

    send_notification(
        user_id=group.created_by,
        notif_type="group_invite",
        title="Nuevo miembro en tu grupo",
        content=f"Alguien se unió a tu grupo {group.name}",
        data={"group_id": group_id},
    )
    return jsonify({"message": "Te uniste al grupo", "group": group.to_dict()}), 200


# --- Solicitud de unirse al grupo ---
@group_bp.route("/<int:group_id>/join-request", methods=["POST"])
@jwt_required()
def request_join_group(group_id):
    user_id = int(get_jwt_identity())
    group = Group.query.get_or_404(group_id)

    existing = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if existing and existing.status in ["active", "pending"]:
        return jsonify({"error": "Ya sos miembro o ya enviaste una solicitud"}), 400

    try:
        if existing:
            existing.status = "pending"
            member = existing
        else:
            member = GroupMember(group_id=group_id, user_id=user_id, status="pending")
            db.session.add(member)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"No se pudo guardar la solicitud: {str(e)}"}), 500

    # Notificar a todos los miembros activos
    active_members = GroupMember.query.filter_by(
        group_id=group_id, status="active"
    ).all()
    for m in active_members:
        send_notification(
            user_id=m.user_id,
            notif_type="join_request",
            title="Solicitud de ingreso al grupo",
            content=f"Un usuario quiere unirse a {group.name}",
            data={"group_id": group_id, "request_user_id": user_id},
        )

    return (
        jsonify(
            {
                "message": "Solicitud enviada",
                "member": {"id": member.id, "status": member.status},
            }
        ),
        200,
    )


# --- Aceptar solicitud ---
@group_bp.route(
    "/<int:group_id>/join-request/<int:request_id>/accept", methods=["POST"]
)
@jwt_required()
def accept_join_request(group_id, request_id):
    user_id = int(get_jwt_identity())
    admin = GroupMember.query.filter_by(
        group_id=group_id, user_id=user_id, role="admin", status="active"
    ).first()
    if not admin:
        return jsonify({"error": "Solo un admin puede aceptar solicitudes"}), 403

    request_member = GroupMember.query.get_or_404(request_id)
    request_member.status = "active"

    group = Group.query.get(group_id)
    if group.current_members + 1 >= group.max_members:
        group.status = "full"

    chat = Chat.query.filter_by(group_id=group_id).first()
    if chat:
        if not ChatMember.query.filter_by(
            chat_id=chat.id, user_id=request_member.user_id
        ).first():
            db.session.add(ChatMember(chat_id=chat.id, user_id=request_member.user_id))

    db.session.commit()

    send_notification(
        user_id=request_member.user_id,
        notif_type="request_accepted",
        title=f"Aceptado en {group.name}",
        content="¡Fuiste agregado al grupo!",
        data={"group_id": group_id},
    )
    return jsonify({"message": "Solicitud aceptada"}), 200


# --- Rechazar solicitud ---
# BUG #3 CORREGIDO: se agregó Group.query.get_or_404(group_id) para definir
# la variable 'group' antes de usarla en send_notification(). Sin esta línea,
# Python lanzaba NameError en runtime al intentar leer group.name.
@group_bp.route(
    "/<int:group_id>/join-request/<int:request_id>/reject", methods=["POST"]
)
@jwt_required()
def reject_join_request(group_id, request_id):
    user_id = int(get_jwt_identity())

    # 1. Verificar que quien rechaza es admin activo del grupo
    admin = GroupMember.query.filter_by(
        group_id=group_id, user_id=user_id, role="admin", status="active"
    ).first()
    if not admin:
        return jsonify({"error": "Solo un admin puede rechazar solicitudes"}), 403

    # 2. Obtener la solicitud y el grupo
    request_member = GroupMember.query.get_or_404(request_id)
    group = Group.query.get_or_404(group_id)  # ← línea que faltaba (Bug #3)

    # 3. Actualizar estado y persistir
    request_member.status = "rejected"
    db.session.commit()

    # 4. Notificar al usuario rechazado (ahora group.name existe y no lanza error)
    send_notification(
        user_id=request_member.user_id,
        notif_type="request_rejected",
        title=f"Solicitud rechazada en {group.name}",
        content="Tu solicitud fue rechazada.",
        data={"group_id": group_id},
    )

    return jsonify({"message": "Solicitud rechazada"}), 200


# --- Salir del grupo ---
@group_bp.route("/<int:group_id>/leave", methods=["POST"])
@jwt_required()
def leave_group(group_id):
    user_id = int(get_jwt_identity())
    member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "No sos miembro de este grupo"}), 404

    member.status = "left"
    group = Group.query.get(group_id)
    if group and group.status == "full":
        group.status = "open"

    db.session.commit()

    active_count = GroupMember.query.filter_by(
        group_id=group_id, status="active"
    ).count()
    if active_count == 0:
        chat = Chat.query.filter_by(group_id=group_id).first()
        if chat:
            ChatMember.query.filter_by(chat_id=chat.id).delete()
            db.session.delete(chat)
        db.session.delete(group)
        db.session.commit()

    return jsonify({"message": "Saliste del grupo"}), 200


# --- Mis grupos ---
@group_bp.route("/my", methods=["GET"])
@jwt_required()
def my_groups():
    user_id = int(get_jwt_identity())
    memberships = GroupMember.query.filter_by(user_id=user_id, status="active").all()
    groups = [m.group.to_dict() for m in memberships]
    return jsonify({"groups": groups}), 200


# --- Actualizar grupo ---
@group_bp.route("/<int:group_id>", methods=["PUT"])
@jwt_required()
def update_group(group_id):
    user_id = int(get_jwt_identity())
    group = Group.query.get_or_404(group_id)

    member = GroupMember.query.filter_by(
        group_id=group_id,
        user_id=user_id,
        status="active",
        role="admin",
    ).first()
    if not member:
        return jsonify({"error": "Solo el administrador del grupo puede editarlo"}), 403

    data = request.get_json()
    group.name = data.get("name", group.name)
    group.description = data.get("description", group.description)
    group.city = data.get("city", group.city)
    group.budget_max = data.get("budget_max", group.budget_max)
    group.pets_allowed = data.get("pets_allowed", group.pets_allowed)
    group.smoking_allowed = data.get("smoking_allowed", group.smoking_allowed)

    db.session.commit()
    return jsonify({"group": group.to_dict()}), 200
