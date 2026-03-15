from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Review, User

review_bp = Blueprint("reviews", __name__)


@review_bp.route("/user/<int:target_id>", methods=["GET"])
def get_user_reviews(target_id):
    reviews = Review.query.filter_by(target_user_id=target_id).order_by(Review.created_at.desc()).all()
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    return jsonify({"reviews": [r.to_dict() for r in reviews], "average": avg, "total": len(reviews)}), 200


@review_bp.route("/listing/<int:listing_id>", methods=["GET"])
def get_listing_reviews(listing_id):
    reviews = Review.query.filter_by(listing_id=listing_id).order_by(Review.created_at.desc()).all()
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    return jsonify({"reviews": [r.to_dict() for r in reviews], "average": avg, "total": len(reviews)}), 200


@review_bp.route("/", methods=["POST"])
@jwt_required()
def create_review():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get("rating") or not (1 <= int(data["rating"]) <= 5):
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    if not data.get("target_user_id") and not data.get("listing_id"):
        return jsonify({"error": "target_user_id or listing_id required"}), 400

    # Prevent duplicate reviews
    existing = Review.query.filter_by(
        reviewer_id=user_id,
        target_user_id=data.get("target_user_id"),
        listing_id=data.get("listing_id"),
    ).first()
    if existing:
        return jsonify({"error": "You already reviewed this"}), 409

    review = Review(
        reviewer_id=user_id,
        target_user_id=data.get("target_user_id"),
        listing_id=data.get("listing_id"),
        rating=int(data["rating"]),
        comment=data.get("comment"),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({"review": review.to_dict()}), 201


@review_bp.route("/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    user_id = int(get_jwt_identity())
    review = Review.query.get_or_404(review_id)
    if review.reviewer_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Review deleted"}), 200
