from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Profile
from ..services.matching_service import compute_compatibility

profile_bp = Blueprint("profiles", __name__)

# FIX: requests_bp eliminado (era código muerto — nunca se registraba en __init__.py)


# ── ACTUALIZAR MI PERFIL ──────────────────────────────────────────────────────
@profile_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_my_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    profile = user.profile
    if not profile:
        profile = Profile(user_id=user_id, name="Nuevo Usuario")
        db.session.add(profile)

    data = request.get_json()

    # FIX: lat y lng agregados a la lista de campos permitidos
    allowed = [
        "name", "age", "gender", "profession", "bio",
        "budget_min", "budget_max", "pets", "smoker",
        "schedule", "diseases", "city", "is_looking",
        "lat", "lng",
        "pref_min_age", "pref_max_age",
    ]

    for field in allowed:
        if field in data:
            setattr(profile, field, data[field])

    db.session.commit()
    return jsonify({"profile": profile.to_dict(include_private=True)}), 200


# ── VER PERFIL DE OTRO USUARIO ────────────────────────────────────────────────
@profile_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_profile(user_id):
    user = User.query.get_or_404(user_id)
    if user.is_blocked():
        return jsonify({"error": "Usuario no disponible"}), 404
    return jsonify({"profile": user.profile.to_dict() if user.profile else None}), 200


# ── BUSCAR PERFILES COMPATIBLES ───────────────────────────────────────────────
@profile_bp.route("/search", methods=["GET"])
@jwt_required()
def search_profiles():
    """Devuelve perfiles con >= 80% de compatibilidad y filtrado recíproco de edad."""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get_or_404(current_user_id)
    my_profile = current_user.profile

    city = request.args.get("city", "Asunción")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    # Parámetros de filtrado
    min_age = request.args.get("min_age", type=int)
    max_age = request.args.get("max_age", type=int)

    pets_filter = request.args.get("pets")       # "true" | "false" | None
    smoker_filter = request.args.get("smoker")   # "true" | "false" | None
    schedule_filter = request.args.get("schedule")  # string | None

    # JOIN explícito para evitar AmbiguousForeignKeysError
    query = (
        Profile.query
        .join(User, Profile.user_id == User.id)
        .filter(
            Profile.user_id != current_user_id,
            Profile.is_looking == True,
            User.status == "active",
            Profile.city == city,
        )
    )

    # Filtrado por edad
    if min_age:
        query = query.filter(Profile.age >= min_age)
    if max_age:
        query = query.filter(Profile.age <= max_age)

    # Filtrado recíproco de edad (el roomie debe aceptar la edad del usuario actual)
    if my_profile and my_profile.age:
        query = query.filter(
            Profile.pref_min_age <= my_profile.age,
            Profile.pref_max_age >= my_profile.age,
        )

    # Aplicar filtros de pets, smoker y schedule
    if pets_filter is not None and pets_filter != "":
        query = query.filter(Profile.pets == (pets_filter.lower() == "true"))
    if smoker_filter is not None and smoker_filter != "":
        query = query.filter(Profile.smoker == (smoker_filter.lower() == "true"))
    if schedule_filter:
        query = query.filter(Profile.schedule == schedule_filter)

    # Obtener todos los perfiles candidatos antes de filtrar por compatibilidad
    all_profiles = query.all()

    results = []
    for p in all_profiles:
        score, matches, mismatches = compute_compatibility(my_profile, p)
        if score >= 0.80:
            d = p.to_dict()
            d["compatibility"] = round(score * 100)
            d["matches"] = matches
            d["mismatches"] = mismatches
            results.append(d)

    # Ordenar por compatibilidad descendente
    results.sort(key=lambda x: x["compatibility"], reverse=True)

    # Paginación
    total = len(results)
    paged = results[(page - 1) * per_page: page * per_page]
    has_more = (page * per_page) < total

    return jsonify({
        "profiles": paged,
        "page": page,
        "total": total,
        "has_more": has_more,
    }), 200