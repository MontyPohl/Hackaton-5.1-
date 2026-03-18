import os
from flask import Flask
from .config import config_map
from .extensions import db, migrate, socketio, jwt, cors


def create_app(env: str = None) -> Flask:
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_map[env])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}},
        supports_credentials=True,
    )

    # threading es el modo correcto para Windows. eventlet con monkey_patch
    # causa que los emit() a rooms de otros clientes fallen silenciosamente
    # en Windows. Sin monkey_patch, threading maneja la concurrencia bien.
    socketio.init_app(
        app,
        cors_allowed_origins=app.config["FRONTEND_URL"],
        async_mode="threading",  # <-- threading funciona en Windows sin monkey_patch
        logger=False,
        engineio_logger=False,
    )

    # Register blueprints
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

    # Register SocketIO handlers
    from .sockets import chat_socket  # noqa: F401

    return app