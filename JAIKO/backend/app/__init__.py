import os
from flask import Flask, jsonify  # ← añadí jsonify
from werkzeug.exceptions import HTTPException  # ← añadí HTTPException
from .config import config_map

# ── Import duplicado eliminado (línea 312 era código muerto) ──
from .extensions import db, migrate, socketio, jwt, cors, limiter


def create_app(env: str | None = None) -> Flask:
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_map[env])

    allowed_origins = "*" if env == "development" else app.config["FRONTEND_URL"]

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )
    socketio.init_app(app, cors_allowed_origins=allowed_origins, async_mode="eventlet")

    # ── Callbacks de JWT ──────────────────────────────────────────────────────
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from .models import TokenBlocklist, User

        jti = jwt_payload["jti"]

        if TokenBlocklist.query.filter_by(jti=jti).first():
            return True

        user_id = int(jwt_payload["sub"])
        user = User.query.get(user_id)
        if user is None or user.is_blocked():
            return True

        return False

    # ── Security headers ──────────────────────────────────────────────────────
    @app.after_request
    def add_security_headers(response):
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return response

    # ── Global error handler ──────────────────────────────────────────────────
    #
    # Por qué existe este handler:
    # Sin él, cualquier excepción no controlada (DB caída, bug inesperado)
    # le devuelve al frontend un traceback completo de Python con nombres de
    # tablas, columnas y rutas internas del servidor — información que no
    # debería ser pública.
    #
    # Cómo funciona:
    # Flask llama a este handler ANTES de enviar cualquier respuesta 500.
    # - Si el error es HTTP normal (404, 400, 401...) lo deja pasar sin tocar.
    # - Si es cualquier otra excepción, loguea el detalle internamente,
    #   hace rollback de la sesión de DB y devuelve un mensaje genérico.
    #
    # El rollback es importante: sin él, una sesión de SQLAlchemy que falló
    # queda en estado inválido y las siguientes queries del mismo proceso
    # también fallan en cascada.
    @app.errorhandler(Exception)
    def handle_unexpected_error(e):
        if isinstance(e, HTTPException):
            return e  # 404, 400, 401, etc. — Flask los maneja normalmente

        app.logger.error("Error no controlado: %s", str(e), exc_info=True)
        db.session.rollback()
        return (
            jsonify(
                {"error": "Error interno del servidor. Por favor intentá más tarde."}
            ),
            500,
        )

    # ── Blueprints ────────────────────────────────────────────────────────────
    from .routes.auth_routes import auth_bp
    from .routes.profile_routes import profile_bp
    from .routes.listing_routes import listing_bp
    from .routes.group_routes import group_bp
    from .routes.chat_routes import chat_bp
    from .routes.notification_routes import notification_bp
    from .routes.review_routes import review_bp
    from .routes.report_routes import report_bp
    from .routes.admin_routes import admin_bp
    from .routes.verification_routes import verification_bp
    from .routes.upload_routes import upload_bp
    from .routes.request_routes import request_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profile_bp, url_prefix="/api/profiles")
    app.register_blueprint(listing_bp, url_prefix="/api/listings")
    app.register_blueprint(group_bp, url_prefix="/api/groups")
    app.register_blueprint(chat_bp, url_prefix="/api/chats")
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")
    app.register_blueprint(review_bp, url_prefix="/api/reviews")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(verification_bp, url_prefix="/api/verification")
    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(request_bp, url_prefix="/api/requests")

    from .sockets import chat_socket  # noqa: F401

    return app
