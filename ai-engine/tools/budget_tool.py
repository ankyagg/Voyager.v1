"""
tools/budget_tool.py
─────────────────────
Phase 1 rule-based budget estimation tool.

Estimates per-trip costs based on destination type, duration, and a budget
cap supplied by the user. No external API; uses a static cost table.

Cost model (per-person, per-day, in INR):
┌──────────────┬───────┬──────┬───────────┐
│ Destination  │ Stay  │ Food │ Transport │
├──────────────┼───────┼──────┼───────────┤
│ beach        │ 2500  │ 800  │  600      │
│ mountain     │ 2000  │ 600  │  800      │
│ heritage     │ 2200  │ 700  │  500      │
│ nature       │ 2000  │ 700  │  700      │
│ city         │ 3000  │ 1000 │  400      │
│ mixed        │ 2200  │ 750  │  600      │
└──────────────┴───────┴──────┴───────────┘
"""

from typing import Dict, Any

# ── Base cost table per destination type (INR / person / day) ─────────────────
_BASE_COSTS: Dict[str, Dict[str, int]] = {
    "beach":    {"stay": 2500, "food": 800,  "transport": 600},
    "mountain": {"stay": 2000, "food": 600,  "transport": 800},
    "heritage": {"stay": 2200, "food": 700,  "transport": 500},
    "nature":   {"stay": 2000, "food": 700,  "transport": 700},
    "city":     {"stay": 3000, "food": 1000, "transport": 400},
    "mixed":    {"stay": 2200, "food": 750,  "transport": 600},
}

_DEFAULT_TYPE = "mixed"


def _parse_budget_inr(budget_str: str) -> int:
    """
    Extract an integer INR amount from a string like "20000 INR" or "₹15000".
    Returns 0 if parsing fails.
    """
    import re
    nums = re.findall(r"\d+", budget_str.replace(",", ""))
    return int(nums[0]) if nums else 0


def estimate_budget(
    destination: str,
    duration_days: int,
    budget_constraint: str,
    destination_type: str = "mixed",
) -> Dict[str, Any]:
    """
    Estimate trip cost breakdown.

    Parameters
    ----------
    destination       : Destination name (for display purposes).
    duration_days     : Number of days.
    budget_constraint : User's stated budget string (e.g. "20000 INR").
    destination_type  : Type from destination_tool (beach / mountain / …).

    Returns
    -------
    dict with keys:
        estimated_cost : Total estimated cost string.
        is_feasible    : bool — True if estimate ≤ budget_constraint.
        breakdown      : dict with stay / food / transport / misc (all in INR).
        tips           : list of budget saving tips.
    """

    # Look up base costs for destination type
    dest_type_key = destination_type.strip().lower()
    costs = _BASE_COSTS.get(dest_type_key, _BASE_COSTS[_DEFAULT_TYPE])

    # Compute totals
    stay_total      = costs["stay"]      * duration_days
    food_total      = costs["food"]      * duration_days
    transport_total = costs["transport"] * duration_days
    misc_total      = int((stay_total + food_total + transport_total) * 0.10)
    grand_total     = stay_total + food_total + transport_total + misc_total

    # Compare against stated budget
    user_budget_inr = _parse_budget_inr(budget_constraint)
    is_feasible     = (user_budget_inr == 0) or (grand_total <= user_budget_inr)

    # Budget tips
    tips = []
    if not is_feasible:
        tips.append(
            f"Estimated cost of ₹{grand_total:,} exceeds your budget of ₹{user_budget_inr:,}. "
            "Consider reducing accommodation tier or trip duration."
        )
    if destination_type == "mountain":
        tips.append("Book transport in advance — mountain routes fill up fast.")
    if destination_type == "beach":
        tips.append("Off-season (June–October) rooms are 30–40% cheaper.")
    if not tips:
        tips.append(
            f"Your budget of ₹{user_budget_inr:,} comfortably covers the estimated ₹{grand_total:,}."
        )

    return {
        "destination": destination,
        "duration_days": duration_days,
        "estimated_cost": f"{grand_total} INR",
        "is_feasible": is_feasible,
        "breakdown": {
            "stay":      str(stay_total),
            "food":      str(food_total),
            "transport": str(transport_total),
            "misc":      str(misc_total),
        },
        "tips": tips,
    }
