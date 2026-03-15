import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Profile, ListingPhoto, Listing
from ..utils.storage import upload_image

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/profile-photo", methods=["POST"])
@jwt_required()
def upload_profile_photo():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        return jsonify({"error": "Only jpg/png/webp allowed"}), 400

    filename  = f"{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_bytes = file.read()

    try:
        url = upload_image(file_bytes, filename, folder="profiles")
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    profile = Profile.query.filter_by(user_id=user_id).first()
    if profile:
        profile.profile_photo_url = url
        db.session.commit()

    return jsonify({"url": url}), 200


@upload_bp.route("/listing/<int:listing_id>/photo", methods=["POST"])
@jwt_required()
def upload_listing_photo(listing_id):
    user_id = int(get_jwt_identity())
    listing = Listing.query.get_or_404(listing_id)

    if listing.owner_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    ext  = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        return jsonify({"error": "Only jpg/png/webp allowed"}), 400

    filename   = f"{listing_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_bytes = file.read()

    try:
        url = upload_image(file_bytes, filename, folder="listings")
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    order = len(listing.photos)
    photo = ListingPhoto(listing_id=listing_id, photo_url=url, order=order)
    db.session.add(photo)
    db.session.commit()

    return jsonify({"photo": photo.to_dict()}), 201


@upload_bp.route("/verification-selfie", methods=["POST"])
@jwt_required()
def upload_verification_selfie():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    ext  = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        return jsonify({"error": "Only jpg/png/webp allowed"}), 400

    filename   = f"verify_{user_id}_{__import__('uuid').uuid4().hex[:8]}.{ext}"
    file_bytes = file.read()

    try:
        url = upload_image(file_bytes, filename, folder="verification")
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    return jsonify({"url": url}), 200
