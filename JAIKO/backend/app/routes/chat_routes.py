from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from ..extensions import db
from ..models import Chat, ChatMember, Message, User
from ..utils.jwt_helpers import get_current_user_id

chat_bp = Blueprint("chats", __name__)


# ── GET /chats ─────────────────────────────────────────────────────────────────
@chat_bp.route("/", methods=["GET"])
@jwt_required()
def get_my_chats():
    user_id = get_current_user_id()
    if user_id is None:
        return ({"error": "Token inválido. Iniciá sesión nuevamente."}, 401)

    chat_ids = [
        row.chat_id
        for row in db.session.query(ChatMember.chat_id).filter_by(user_id=user_id).all()
    ]
    if not chat_ids:
        return ({"chats": []}), 200

    # Carga chats + miembros + perfiles en una sola query (evita N+1)
    chats = (
        Chat.query.filter(Chat.id.in_(chat_ids))
        .options(joinedload(Chat.members).joinedload(ChatMember.user))
        .all()
    )

    # Obtiene el último mensaje por chat con una subquery MAX(id)
    last_msg_subq = (
        db.session.query(func.max(Message.id))
        .filter(Message.chat_id.in_(chat_ids))
        .group_by(Message.chat_id)
        .subquery()
    )
    last_messages = (
        Message.query.filter(Message.id.in_(last_msg_subq))
        .options(joinedload(Message.sender))
        .all()
    )
    last_msg_by_chat = {m.chat_id: m for m in last_messages}

    result = []
    for chat in chats:
        last_msg = last_msg_by_chat.get(chat.id)

        # ── FIX LÍNEAS FANTASMA ────────────────────────────────────────────────
        # Los chats privados sin ningún mensaje son "fantasmas": aparecen en la
        # lista pero están vacíos. Los filtramos para mantener la UI limpia.
        # Los chats de grupo y de listing SIEMPRE se incluyen aunque estén vacíos,
        # porque el grupo los necesita visibles desde el momento en que se crea.
        if chat.type == "private" and last_msg is None:
            continue  # ← saltar este chat, no lo agregamos al resultado

        result.append({
            "id":           chat.id,
            "type":         chat.type,
            "group_id":     chat.group_id,
            "listing_id":   chat.listing_id,
            "members":      [m.to_dict() for m in chat.members],
            "last_message": last_msg.to_dict() if last_msg else None,
            "created_at":   chat.created_at.isoformat(),
        })

    result.sort(
        key=lambda c: c["last_message"]["created_at"] if c.get("last_message") else "",
        reverse=True,
    )
    return ({"chats": result}), 200


# ── POST /chats/private/<other_user_id> ────────────────────────────────────────
@chat_bp.route("/private/<int:other_user_id>", methods=["POST"])
@jwt_required()
def get_or_create_private_chat(other_user_id):
    """
    Obtiene o crea un chat privado entre el usuario autenticado y otro usuario.

    Reglas de negocio:
      1. Solo se permite si ambos tienen una relación de roomie confirmada
         (uno tiene al otro como current_roomie_id en su perfil).
      2. Si ambos están en el mismo grupo activo, se bloquea el chat privado
         y se devuelve el ID del chat grupal para redirigir al frontend.
    """
    # Import local para evitar circular imports entre modelos
    from ..models import Profile, GroupMember

    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "Token inválido. Iniciá sesión nuevamente."}), 401

    if user_id == other_user_id:
        return jsonify({"error": "No podés chatear con vos mismo"}), 400

    # Verifica que el otro usuario existe en la BD
    other_user = User.query.get_or_404(other_user_id)

    # ── Regla 1: Solo roomies confirmados pueden abrir chat privado ────────────
    #
    # ¿Qué es un "roomie confirmado"?
    # La columna current_roomie_id del perfil de un usuario apunta al ID del
    # usuario con quien convive actualmente. La relación es bilateral pero puede
    # estar registrada en cualquiera de los dos perfiles (o en ambos).
    #
    # Ejemplo: Ana (id=1) acepta a Juan (id=2) como roomie.
    #   Ana.profile.current_roomie_id = 2   ← la relación quedó en el perfil de Ana
    #   Juan.profile.current_roomie_id = 1  ← o en el de Juan, o en ambos
    #
    # Verificamos AMBAS direcciones para no depender del orden en que se creó.
    my_profile    = Profile.query.filter_by(user_id=user_id).first()
    other_profile = Profile.query.filter_by(user_id=other_user_id).first()

    are_roomies = (
        (my_profile    and my_profile.current_roomie_id    == other_user_id) or
        (other_profile and other_profile.current_roomie_id == user_id)
    )

    if not are_roomies:
        return jsonify({
            "error": (
                "Solo podés enviar mensajes privados a tu roomie confirmado. "
                "Enviá primero una solicitud de roomie y esperá que la acepten."
            ),
            "code": "NOT_ROOMIES",
        }), 403

    # ── Regla 2: Si están en el mismo grupo, usar el chat grupal ──────────────
    #
    # Cuando dos usuarios pertenecen al mismo grupo activo, la comunicación
    # debe pasar por el chat del grupo (para que todos los miembros estén
    # al tanto). No tiene sentido tener conversaciones paralelas.
    #
    # GroupMember.status = 'active' filtra miembros que ya abandonaron el grupo.
    my_group    = GroupMember.query.filter_by(user_id=user_id,       status="active").first()
    their_group = GroupMember.query.filter_by(user_id=other_user_id, status="active").first()

    if my_group and their_group and my_group.group_id == their_group.group_id:
        # Buscamos el chat que le corresponde a ese grupo para devolver su ID
        # y que el frontend pueda redirigir directamente
        group_chat = Chat.query.filter_by(
            type="group", group_id=my_group.group_id
        ).first()

        return jsonify({
            "error": (
                "Están en el mismo grupo. "
                "Usá el chat del grupo para comunicarte con los otros miembros."
            ),
            "code":          "SAME_GROUP",
            "group_id":      my_group.group_id,
            "group_chat_id": group_chat.id if group_chat else None,
        }), 403

    # ── Si pasó ambas reglas: buscar o crear el chat privado ──────────────────
    # Subconsulta: chats privados donde yo soy miembro
    my_chats = (
        db.session.query(Chat.id)
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .filter(Chat.type == "private", ChatMember.user_id == user_id)
        .subquery()
    )
    # De esos chats, ver si el otro también es miembro → chat ya existe
    existing = (
        Chat.query.filter(Chat.id.in_(my_chats))
        .join(ChatMember, ChatMember.chat_id == Chat.id)
        .filter(ChatMember.user_id == other_user_id)
        .first()
    )
    if existing:
        return jsonify({"chat": existing.to_dict()}), 200

    # Crear nuevo chat privado con ambos usuarios
    chat = Chat(type="private")
    db.session.add(chat)
    db.session.flush()
    db.session.add(ChatMember(chat_id=chat.id, user_id=user_id))
    db.session.add(ChatMember(chat_id=chat.id, user_id=other_user_id))
    db.session.commit()
    return jsonify({"chat": chat.to_dict()}), 201


# ── GET /chats/<chat_id>/messages ──────────────────────────────────────────────
@chat_bp.route("/<int:chat_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(chat_id):
    user_id = get_current_user_id()
    if user_id is None:
        return ({"error": "Token inválido. Iniciá sesión nuevamente."}, 401)

    # Verifica que el usuario es miembro del chat antes de mostrar mensajes
    member = ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not member:
        return ({"error": "No sos miembro de este chat"}), 403

    page     = request.args.get("page",     1,  type=int) or 1
    per_page = request.args.get("per_page", 50, type=int) or 50

    messages = (
        Message.query.filter_by(chat_id=chat_id)
        .order_by(Message.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    messages.reverse()  # Devolver en orden cronológico ascendente
    return ({"messages": [m.to_dict() for m in messages], "page": page}), 200
