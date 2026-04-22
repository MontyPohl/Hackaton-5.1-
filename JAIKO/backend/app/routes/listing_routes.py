from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Listing, ListingPhoto, User
from ..utils.jwt_helpers import get_current_user_id

listing_bp = Blueprint("listings", __name__)

# Valores válidos para preferred_gender — sirve para validar el input del frontend
VALID_GENDERS = {"any", "male", "female", "non_binary"}


# ── GET /listings ─────────────────────────────────────────────────────────────
@listing_bp.route("/", methods=["GET"])
def get_listings():
    city         = request.args.get("city", "Asunción")
    min_price    = request.args.get("min_price",    type=int)
    max_price    = request.args.get("max_price",    type=int)
    pets         = request.args.get("pets_allowed")
    smoking      = request.args.get("smoking_allowed")
    listing_type = request.args.get("type")
    page         = request.args.get("page",     1,  type=int) or 1
    per_page     = request.args.get("per_page", 20, type=int) or 20

    # ── Nuevos parámetros de filtro ───────────────────────────────────────────
    preferred_gender = request.args.get("preferred_gender")  # 'male'|'female'|'non_binary'|None
    min_age          = request.args.get("min_age", type=int) # edad del usuario que busca

    q = Listing.query.filter(
        Listing.city   == city,
        Listing.status == "active",
    )

    if listing_type:
        q = q.filter(Listing.type == listing_type)

    if min_price:
        q = q.filter(Listing.total_price >= min_price)
    if max_price:
        q = q.filter(Listing.total_price <= max_price)

    if pets == "true":
        q = q.filter(Listing.pets_allowed == True)
    elif pets == "false":
        q = q.filter(Listing.pets_allowed == False)

    if smoking == "true":
        q = q.filter(Listing.smoking_allowed == True)
    elif smoking == "false":
        q = q.filter(Listing.smoking_allowed == False)

    # ── Filtro por género preferido ───────────────────────────────────────────
    #
    # Lógica: el usuario que busca tiene un género X.
    # Solo queremos mostrarle listings donde el dueño busca ese género O
    # donde no tiene preferencia ('any').
    #
    # Ejemplo: si el usuario filtra preferred_gender='female', mostramos:
    #   - listings con preferred_gender = 'female'  (el dueño quiere mujer)
    #   - listings con preferred_gender = 'any'     (el dueño no tiene preferencia)
    #   - listings con preferred_gender IS NULL      (registros viejos sin dato)
    #
    # No mostramos listings que pidan explícitamente otro género.
    if preferred_gender and preferred_gender in VALID_GENDERS and preferred_gender != "any":
        q = q.filter(
            db.or_(
                Listing.preferred_gender == preferred_gender,
                Listing.preferred_gender == "any",
                Listing.preferred_gender.is_(None),  # compatibilidad con registros viejos
            )
        )

    # ── Filtro por edad mínima requerida ──────────────────────────────────────
    #
    # Lógica: el usuario tiene X años de edad y quiere ver listings que lo acepten.
    # Un listing lo acepta si su min_age_required <= edad del usuario.
    #
    # Ejemplo: si el usuario tiene 22 años y filtra min_age=22:
    #   - Listing con min_age_required = 18 → ✓ (el usuario cumple el requisito)
    #   - Listing con min_age_required = 22 → ✓ (el usuario cumple exacto)
    #   - Listing con min_age_required = 25 → ✗ (el usuario no cumple)
    #   - Listing con min_age_required IS NULL → ✓ (sin restricción de edad)
    if min_age and min_age >= 18:
        q = q.filter(
            db.or_(
                Listing.min_age_required <= min_age,
                Listing.min_age_required.is_(None),  # compatibilidad con registros viejos
            )
        )

    total    = q.count()
    listings = (
        q.order_by(Listing.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return (
        jsonify({
            "listings": [l.to_dict() for l in listings],
            "total":    total,
            "page":     page,
            "pages":    (total + per_page - 1) // per_page,
        }),
        200,
    )


# ── GET /listings/<id> ────────────────────────────────────────────────────────
@listing_bp.route("/<int:listing_id>", methods=["GET"])
def get_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    data = listing.to_dict()
    owner_profile = listing.owner.profile
    data["owner"] = owner_profile.to_dict() if owner_profile else None
    return jsonify({"listing": data}), 200


# ── POST /listings ────────────────────────────────────────────────────────────
@listing_bp.route("/", methods=["POST"])
@jwt_required()
def create_listing():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "Token inválido. Iniciá sesión nuevamente."}), 401

    data     = request.get_json()
    required = ["title", "city", "total_price", "rooms", "max_people"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"{f} is required"}), 400

    # ── Validar preferred_gender si viene en el payload ───────────────────────
    preferred_gender = data.get("preferred_gender", "any")
    if preferred_gender not in VALID_GENDERS:
        preferred_gender = "any"   # si viene un valor inválido, lo ignoramos

    # ── Validar min_age_required ──────────────────────────────────────────────
    # Mínimo 18 (mayoría de edad), máximo 80 para evitar valores absurdos.
    # Si viene null o un número fuera de rango, usamos 18 como fallback.
    raw_min_age = data.get("min_age_required", 18)
    try:
        min_age_required = int(raw_min_age)
        if not (18 <= min_age_required <= 80):
            min_age_required = 18
    except (TypeError, ValueError):
        min_age_required = 18

    listing = Listing(
        owner_id         = user_id,
        title            = data["title"],
        description      = data.get("description"),
        city             = data["city"],
        neighborhood     = data.get("neighborhood"),
        address          = data.get("address"),
        latitude         = data.get("latitude"),
        longitude        = data.get("longitude"),
        total_price      = data["total_price"],
        rooms            = data["rooms"],
        bathrooms        = data.get("bathrooms", 1),
        max_people       = data["max_people"],
        pets_allowed     = data.get("pets_allowed", False),
        smoking_allowed  = data.get("smoking_allowed", False),
        furnished        = data.get("furnished", False),
        type             = data.get("type", "apartment"),
        status           = "active",
        # Nuevos campos
        preferred_gender = preferred_gender,
        min_age_required = min_age_required,
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({"listing": listing.to_dict()}), 201


# ── PUT /listings/<id> ────────────────────────────────────────────────────────
@listing_bp.route("/<int:listing_id>", methods=["PUT"])
@jwt_required()
def update_listing(listing_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "Token inválido. Iniciá sesión nuevamente."}), 401

    listing = Listing.query.get_or_404(listing_id)
    if listing.owner_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()

    # Lista de campos que el dueño puede actualizar (incluimos los nuevos)
    updatable = [
        "title", "description", "city", "neighborhood", "address",
        "latitude", "longitude", "total_price", "rooms", "bathrooms",
        "max_people", "pets_allowed", "smoking_allowed", "furnished",
        "type", "status",
        # Nuevos campos editables
        "preferred_gender", "min_age_required",
    ]
    for f in updatable:
        if f in data:
            setattr(listing, f, data[f])

    # Re-validar preferred_gender por si vino un valor inválido
    if listing.preferred_gender not in VALID_GENDERS:
        listing.preferred_gender = "any"

    # Re-validar min_age_required
    if listing.min_age_required is not None:
        try:
            age = int(listing.min_age_required)
            listing.min_age_required = age if 18 <= age <= 80 else 18
        except (TypeError, ValueError):
            listing.min_age_required = 18

    db.session.commit()
    return jsonify({"listing": listing.to_dict()}), 200


# ── DELETE /listings/<id> ─────────────────────────────────────────────────────
@listing_bp.route("/<int:listing_id>", methods=["DELETE"])
@jwt_required()
def delete_listing(listing_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "Token inválido. Iniciá sesión nuevamente."}), 401

    listing = Listing.query.get_or_404(listing_id)
    if listing.owner_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    # Borrado lógico — no eliminamos el registro físicamente
    listing.status = "deleted"
    db.session.commit()
    return jsonify({"message": "Listing deleted"}), 200


# ── GET /listings/my ──────────────────────────────────────────────────────────
@listing_bp.route("/my", methods=["GET"])
@jwt_required()
def my_listings():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "Token inválido. Iniciá sesión nuevamente."}), 401

    listings = (
        Listing.query.filter_by(owner_id=user_id)
        .order_by(Listing.created_at.desc())
        .all()
    )
    return jsonify({"listings": [l.to_dict() for l in listings]}), 200
