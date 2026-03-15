import random
import string
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import VerificationRequest, User, Profile

verification_bp = Blueprint("verification", __name__)


def verifier_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)
        if user.role not in ("admin", "verifier"):
            return jsonify({"error": "Verifier access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def _generate_code() -> str:
    return "JAIKO-" + "".join(random.choices(string.digits, k=4))


@verification_bp.route("/request", methods=["POST"])
@jwt_required()
def request_verification():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    existing = VerificationRequest.query.filter_by(user_id=user_id).first()
    if existing:
        if existing.status == "verified":
            return jsonify({"error": "Already verified"}), 400
        # Re-request: reset
        existing.verification_code = _generate_code()
        existing.status = "pending_verification"
        existing.selfie_url = None
        existing.rejection_reason = None
        db.session.commit()
        return jsonify({"verification": existing.to_dict()}), 200

    code = _generate_code()
    vr = VerificationRequest(user_id=user_id, verification_code=code)
    db.session.add(vr)

    # Update profile verification status
    if user.profile:
        user.profile.verification_status = "pending_verification"

    db.session.commit()
    return jsonify({"verification": vr.to_dict()}), 201


@verification_bp.route("/upload-selfie", methods=["POST"])
@jwt_required()
def upload_selfie():
    user_id = int(get_jwt_identity())
    vr = VerificationRequest.query.filter_by(user_id=user_id).first()
    if not vr:
        return jsonify({"error": "No verification request found. Request one first."}), 404

    data = request.get_json()
    if not data.get("selfie_url"):
        return jsonify({"error": "selfie_url required"}), 400

    vr.selfie_url = data["selfie_url"]
    vr.status = "pending_verification"
    db.session.commit()
    return jsonify({"verification": vr.to_dict()}), 200


@verification_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_verification():
    user_id = int(get_jwt_identity())
    vr = VerificationRequest.query.filter_by(user_id=user_id).first()
    if not vr:
        return jsonify({"verification": None}), 200
    return jsonify({"verification": vr.to_dict()}), 200


# ─── Verifier endpoints ────────────────────────────────────────────────────────

@verification_bp.route("/pending", methods=["GET"])
@verifier_required
def get_pending():
    pending = VerificationRequest.query.filter_by(status="pending_verification").all()
    return jsonify({"pending": [v.to_dict() for v in pending], "total": len(pending)}), 200


@verification_bp.route("/<int:vr_id>/review", methods=["PUT"])
@verifier_required
def review_verification(vr_id):
    reviewer_id = int(get_jwt_identity())
    vr = VerificationRequest.query.get_or_404(vr_id)
    data = request.get_json()

    action = data.get("action")  # approve | reject
    if action not in ("approve", "reject"):
        return jsonify({"error": "action must be approve or reject"}), 400

    vr.reviewed_by = reviewer_id
    user = User.query.get(vr.user_id)

    if action == "approve":
        vr.status = "verified"
        if user and user.profile:
            user.profile.verified = True
            user.profile.verification_status = "verified"
    else:
        vr.status = "rejected"
        vr.rejection_reason = data.get("reason", "No cumple los requisitos")
        if user and user.profile:
            user.profile.verification_status = "rejected"

    db.session.commit()
    return jsonify({"verification": vr.to_dict()}), 200
