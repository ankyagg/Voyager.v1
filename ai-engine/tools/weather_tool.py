"""
tools/weather_tool.py
──────────────────────
Phase 2 — Rule-based weather information tool.

Returns typical weather conditions for a destination by month.
No external API — fully offline for Phase 2.

In Phase 3+ this would call a weather API (OpenWeatherMap, etc.).
"""

from typing import Dict, Any
import datetime

# ── Static weather knowledge base ─────────────────────────────────────────────
# Typical conditions keyed by (destination_lower, month_number).
# Fallback to destination-level entry if month is not specified.
_MONTHLY_WEATHER: Dict[str, Dict[int, Dict[str, Any]]] = {
    "goa": {
        11: {"temp_c": "26-30", "condition": "Sunny, dry, pleasant", "tip": "Peak season begins"},
        12: {"temp_c": "22-28", "condition": "Cool, dry, perfect beach weather", "tip": "Busiest month"},
        1:  {"temp_c": "21-28", "condition": "Cool and sunny, ideal for all activities", "tip": "Best month"},
        2:  {"temp_c": "23-30", "condition": "Warm and dry", "tip": "Great for beaches"},
        3:  {"temp_c": "25-33", "condition": "Getting hot, fewer tourists", "tip": "Good deals on hotels"},
        6:  {"temp_c": "24-28", "condition": "Heavy monsoon, most beaches closed", "tip": "Avoid beach trips"},
        7:  {"temp_c": "24-28", "condition": "Heavy rain, waterfalls peak", "tip": "Good for Dudhsagar visit"},
    },
    "manali": {
        3:  {"temp_c":  "2-17",  "condition": "Snow melting, roads opening", "tip": "Rohtang may still be closed"},
        4:  {"temp_c":  "5-20",  "condition": "Pleasant spring weather", "tip": "Good for sightseeing"},
        5:  {"temp_c":  "8-25",  "condition": "Warm days, cool nights", "tip": "Peak season starts"},
        6:  {"temp_c": "10-27",  "condition": "Sunny but occasional rain", "tip": "Rohtang Pass permits required"},
        10: {"temp_c": "-5-15",  "condition": "Cold, Rohtang closing for winter", "tip": "Last chance for pass"},
        12: {"temp_c": "-10-5",  "condition": "Heavy snowfall, skiing season", "tip": "Solang Valley open for skiing"},
        1:  {"temp_c": "-15-2",  "condition": "Very cold, heavy snow", "tip": "Skiing at Solang Valley"},
    },
    "jaipur": {
        10: {"temp_c": "18-32", "condition": "Pleasant, post-monsoon greenery", "tip": "Great for sightseeing"},
        11: {"temp_c": "12-28", "condition": "Cool and dry, ideal", "tip": "Best month for Jaipur"},
        12: {"temp_c":  "8-22", "condition": "Cool winter, fog possible in mornings", "tip": "Carry a light jacket"},
        1:  {"temp_c":  "6-20", "condition": "Cold mornings, warm afternoons", "tip": "Kite Festival season"},
        2:  {"temp_c": "10-24", "condition": "Warming up, pleasant", "tip": "Desert Festival nearby"},
        4:  {"temp_c": "22-38", "condition": "Hot, visit early morning only", "tip": "Hydrate frequently"},
        5:  {"temp_c": "26-42", "condition": "Very hot, dusty", "tip": "Only visit indoors/evenings"},
    },
    "kerala": {
        10: {"temp_c": "24-32", "condition": "Post-monsoon, lush and green", "tip": "Backwaters at their best"},
        11: {"temp_c": "23-31", "condition": "Sunny, mild rain possible", "tip": "Ideal houseboat season"},
        12: {"temp_c": "22-30", "condition": "Cool and dry, perfect", "tip": "Peak tourist season"},
        1:  {"temp_c": "20-29", "condition": "Pleasant, sunny", "tip": "Best time for beaches"},
        6:  {"temp_c": "24-29", "condition": "Heavy monsoon — Kerala receives India's first rain", "tip": "Best for Ayurveda"},
        7:  {"temp_c": "23-28", "condition": "Peak monsoon, very heavy rain", "tip": "Avoid short trips"},
    },
    "ladakh": {
        6:  {"temp_c": "5-25",  "condition": "Pleasant, roads open", "tip": "Best time starts"},
        7:  {"temp_c": "7-27",  "condition": "Sunny, occasional afternoon clouds", "tip": "Peak season"},
        8:  {"temp_c": "6-26",  "condition": "Warm days, cool nights", "tip": "Busiest month"},
        9:  {"temp_c": "2-22",  "condition": "Cooling down, roads still open", "tip": "Fewer crowds"},
        1:  {"temp_c": "-20-2", "condition": "Extremely cold, Chadar Trek season", "tip": "Only for experienced trekkers"},
    },
}

# ── Destination-level defaults ─────────────────────────────────────────────────
_DESTINATION_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "goa":     {"temp_c": "24-30", "condition": "Tropical beach climate",       "climate_type": "tropical"},
    "manali":  {"temp_c": "5-20",  "condition": "Alpine mountain climate",       "climate_type": "alpine"},
    "jaipur":  {"temp_c": "15-35", "condition": "Arid desert climate",           "climate_type": "arid"},
    "kerala":  {"temp_c": "22-32", "condition": "Tropical humid climate",        "climate_type": "tropical"},
    "ladakh":  {"temp_c": "-5-20", "condition": "High-altitude cold desert",     "climate_type": "alpine"},
}

_GENERIC_DEFAULT = {"temp_c": "20-30", "condition": "Moderate climate", "climate_type": "moderate"}


def get_weather(destination: str, month: int | None = None) -> Dict[str, Any]:
    """
    Return typical weather info for a destination.

    Parameters
    ----------
    destination : str
        Destination name (case-insensitive).
    month : int or None
        Month number (1=January … 12=December).
        If None, uses the current calendar month.

    Returns
    -------
    dict with keys: destination, month, temp_c, condition, climate_type, travel_tip.
    """
    if month is None:
        month = datetime.datetime.now().month

    key = destination.strip().lower()

    # Try exact match first, then partial match
    dest_key = None
    for db_key in _MONTHLY_WEATHER:
        if db_key == key or db_key in key or key in db_key:
            dest_key = db_key
            break

    month_data = {}
    dest_default = _GENERIC_DEFAULT

    if dest_key:
        dest_default = _DESTINATION_DEFAULTS.get(dest_key, _GENERIC_DEFAULT)
        month_data   = _MONTHLY_WEATHER[dest_key].get(month, {})

    temp_c     = month_data.get("temp_c",    dest_default.get("temp_c", "20-30"))
    condition  = month_data.get("condition", dest_default.get("condition", "Moderate"))
    travel_tip = month_data.get("tip", "Check local conditions before travel.")

    return {
        "destination":  destination.strip().title(),
        "month":        datetime.date(2000, month, 1).strftime("%B"),
        "temp_c":       temp_c,
        "condition":    condition,
        "climate_type": dest_default.get("climate_type", "moderate"),
        "travel_tip":   travel_tip,
    }
