from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from ..extensions import db
from ..models import User
from flask import current_app

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/google", methods=["POST"])
def google_login():
    """Validate Google ID token and return JAIKO JWT."""
    data = request.get_json()
    if not data or "id_token" not in data:
        return jsonify({"error": "id_token required"}), 400

    try:
        id_info = id_token.verify_oauth2_token(
            data["id_token"],
            google_requests.Request(),
            current_app.config["GOOGLE_CLIENT_ID"],
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

    google_id = id_info["sub"]
    email = id_info["email"]
    name = id_info.get("name", "")
    picture = id_info.get("picture", "")

    # Find or create user
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, google_id=google_id)
        db.session.add(user)
        db.session.flush()

        # Auto-create minimal profile
        from ..models import Profile
        profile = Profile(user_id=user.id, name=name, profile_photo_url=picture)
        db.session.add(profile)

    else:
        user.google_id = google_id
        user.last_login = datetime.utcnow()

    if user.is_blocked():
        return jsonify({"error": "Account blocked"}), 403

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user": user.to_dict(),
        "profile": user.profile.to_dict() if user.profile else None,
        "is_new_user": not bool(user.profile and user.profile.age),
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({
        "user": user.to_dict(),
        "profile": user.profile.to_dict(include_private=True) if user.profile else None,
    }), 200
