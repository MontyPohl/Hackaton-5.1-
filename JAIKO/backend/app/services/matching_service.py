from typing import Tuple


def compute_compatibility(profile_a, profile_b) -> Tuple[float, list, list]:
    """
    Devuelve (score, matches, mismatches).
    score entre 0.0 y 1.0.
    Solo evalúa criterios donde AMBOS perfiles tienen datos.
    """
    if not profile_a or not profile_b:
        return 0.0, [], []

    matches = []
    mismatches = []

    # ── Presupuesto ───────────────────────────────────────────────────────────
    a_min = profile_a.budget_min
    a_max = profile_a.budget_max
    b_min = profile_b.budget_min
    b_max = profile_b.budget_max

    if all(v is not None for v in [a_min, a_max, b_min, b_max]):
        if a_min <= b_max and b_min <= a_max:
            matches.append("presupuesto")
        else:
            mismatches.append("presupuesto")

    # ── Edad — FIX: usar pref_min_age/pref_max_age en lugar de diferencia fija ─
    if profile_a.age and profile_b.age:
        a_min_pref = profile_a.pref_min_age or 18
        a_max_pref = profile_a.pref_max_age or 99
        b_min_pref = profile_b.pref_min_age or 18
        b_max_pref = profile_b.pref_max_age or 99

        # A acepta la edad de B  Y  B acepta la edad de A
        a_accepts_b = b_min_pref <= profile_a.age <= b_max_pref
        b_accepts_a = a_min_pref <= profile_b.age <= a_max_pref

        if a_accepts_b and b_accepts_a:
            matches.append("edad")
        else:
            mismatches.append("edad")

    # ── Mascotas ──────────────────────────────────────────────────────────────
    if profile_a.pets is not None and profile_b.pets is not None:
        if profile_a.pets == profile_b.pets:
            matches.append("mascotas")
        else:
            mismatches.append("mascotas")

    # ── Fumador ───────────────────────────────────────────────────────────────
    if profile_a.smoker is not None and profile_b.smoker is not None:
        if profile_a.smoker == profile_b.smoker:
            matches.append("fumar")
        else:
            mismatches.append("fumar")

    # ── Horario ───────────────────────────────────────────────────────────────
    if profile_a.schedule and profile_b.schedule:
        if profile_a.schedule == profile_b.schedule or "flexible" in (
            profile_a.schedule,
            profile_b.schedule,
        ):
            matches.append("horario")
        else:
            mismatches.append("horario")

    total = len(matches) + len(mismatches)
    score = len(matches) / total if total > 0 else 0.0

    return score, matches, mismatches