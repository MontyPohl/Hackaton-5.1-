from typing import Tuple


def compute_compatibility(profile_a, profile_b) -> Tuple[float, list, list]:
    """
    Returns (score, matches, mismatches).
    score is between 0.0 and 1.0.
    Only evaluates filters where BOTH profiles have data.
    """
    if not profile_a or not profile_b:
        return 0.0, [], []

    matches = []
    mismatches = []

    # ── Budget ────────────────────────────────────────────────────────────────
    a_min = profile_a.budget_min
    a_max = profile_a.budget_max
    b_min = profile_b.budget_min
    b_max = profile_b.budget_max

    if all(v is not None for v in [a_min, a_max, b_min, b_max]):
        # Ranges overlap?
        if a_min <= b_max and b_min <= a_max:
            matches.append("presupuesto")
        else:
            mismatches.append("presupuesto")

    # ── Gender preference (loose – only mismatch if explicitly different) ──────
    if profile_a.gender and profile_b.gender:
        # No hard gender filter by default; skip for now
        pass

    # ── Age (within 10-year band) ─────────────────────────────────────────────
    if profile_a.age and profile_b.age:
        if abs(profile_a.age - profile_b.age) <= 10:
            matches.append("edad")
        else:
            mismatches.append("edad")

    # ── Pets ──────────────────────────────────────────────────────────────────
    if profile_a.pets is not None and profile_b.pets is not None:
        if profile_a.pets == profile_b.pets:
            matches.append("mascotas")
        else:
            mismatches.append("mascotas")

    # ── Smoker ────────────────────────────────────────────────────────────────
    if profile_a.smoker is not None and profile_b.smoker is not None:
        if profile_a.smoker == profile_b.smoker:
            matches.append("fumar")
        else:
            mismatches.append("fumar")

    # ── Schedule ──────────────────────────────────────────────────────────────
    if profile_a.schedule and profile_b.schedule:
        if profile_a.schedule == profile_b.schedule or "flexible" in (
            profile_a.schedule, profile_b.schedule
        ):
            matches.append("horario")
        else:
            mismatches.append("horario")

    total = len(matches) + len(mismatches)
    score = len(matches) / total if total > 0 else 0.0

    return score, matches, mismatches
