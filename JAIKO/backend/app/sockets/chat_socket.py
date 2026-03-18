from datetime import datetime, timedelta
from flask import request
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from ..extensions import socketio, db
from ..models import Chat, ChatMember, Message

# FIX: dict para almacenar user_id por sid (evita decodificar JWT en cada evento)
_socket_users: dict[str, int] = {}

ACTIVE_THRESHOLD = timedelta(seconds=30)


def _authenticate_socket() -> int | None:
    """Solo se usa en on_connect para autenticar una vez."""
    token = request.args.get("token") or (
        request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    if not token:
        return None
    try:
        decoded = decode_token(token)
        return int(decoded["sub"])
    except Exception:
        return None


@socketio.on("connect")
def on_connect():
    user_id = _authenticate_socket()
    if not user_id:
        disconnect()
        return False

    # FIX: guardar user_id en el dict (no decodificar JWT en cada evento)
    _socket_users[request.sid] = user_id
    join_room(f"user_{user_id}")
    emit("connected", {"user_id": user_id})
    print(f"[SOCKET] Usuario {user_id} conectado (sid={request.sid})")


@socketio.on("disconnect")
def on_disconnect():
    # FIX: limpiar el dict al desconectar
    user_id = _socket_users.pop(request.sid, None)
    if user_id:
        leave_room(f"user_{user_id}")
        print(f"[SOCKET] Usuario {user_id} desconectado (sid={request.sid})")


@socketio.on("join_chat")
def on_join_chat(data):
    # FIX: obtener user_id del dict en lugar de decodificar JWT
    user_id = _socket_users.get(request.sid)
    if not user_id:
        return

    chat_id = data.get("chat_id")
    if not chat_id:
        return

    member = ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not member:
        emit("error", {"message": "No sos miembro de este chat"})
        return

    join_room(f"chat_{chat_id}")
    print(f"[SOCKET] Usuario {user_id} unido al room chat_{chat_id}")
    emit("joined_chat", {"chat_id": chat_id})


@socketio.on("leave_chat")
def on_leave_chat(data):
    user_id = _socket_users.get(request.sid)
    if not user_id:
        return
    chat_id = data.get("chat_id")
    if chat_id:
        leave_room(f"chat_{chat_id}")
        print(f"[SOCKET] Usuario {user_id} salió del room chat_{chat_id}")


@socketio.on("send_message")
def on_send_message(data):
    user_id = _socket_users.get(request.sid)
    if not user_id:
        return

    chat_id = data.get("chat_id")
    content = data.get("content", "").strip()

    if not chat_id or not content:
        emit("error", {"message": "chat_id y content son requeridos"})
        return

    member = ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not member:
        emit("error", {"message": "No sos miembro de este chat"})
        return

    msg = Message(
        chat_id=chat_id,
        sender_id=user_id,
        content=content,
        type=data.get("type", "text"),
    )
    db.session.add(msg)
    member.last_read_at = datetime.utcnow()
    db.session.commit()

    msg_dict = msg.to_dict()

    # Emitir al room del chat (incluye al emisor)
    emit("receive_message", msg_dict, to=f"chat_{chat_id}")

    # Emitir al room personal de cada miembro (por si no están en join_chat)
    chat = Chat.query.filter_by(id=chat_id).first()
    if not chat:
        return

    for cm in chat.members:
        if cm.user_id != user_id:
            emit("receive_message", msg_dict, to=f"user_{cm.user_id}")

    # FIX: notificación solo si el destinatario NO está activo en el chat
    sender_profile = msg.sender.profile
    sender_name = sender_profile.name if sender_profile else "Alguien"

    from ..services.notification_service import send_notification
    now = datetime.utcnow()

    for cm in chat.members:
        if cm.user_id == user_id:
            continue
        # Si leyó en los últimos 30 segundos, probablemente tiene el chat abierto
        is_active = cm.last_read_at and (now - cm.last_read_at) < ACTIVE_THRESHOLD
        if not is_active:
            send_notification(
                user_id=cm.user_id,
                type="message",
                title=f"Nuevo mensaje de {sender_name}",
                content=content[:100],
                data={"chat_id": chat_id},
            )


@socketio.on("typing")
def on_typing(data):
    user_id = _socket_users.get(request.sid)
    if not user_id:
        return
    chat_id = data.get("chat_id")
    if chat_id:
        emit(
            "user_typing",
            {"user_id": user_id, "chat_id": chat_id},
            to=f"chat_{chat_id}",
            include_self=False,
        )


@socketio.on("stop_typing")
def on_stop_typing(data):
    user_id = _socket_users.get(request.sid)
    if not user_id:
        return
    chat_id = data.get("chat_id")
    if chat_id:
        emit(
            "user_stop_typing",
            {"user_id": user_id, "chat_id": chat_id},
            to=f"chat_{chat_id}",
            include_self=False,
        )