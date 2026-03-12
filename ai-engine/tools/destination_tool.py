"""
tools/destination_tool.py
──────────────────────────
Phase 1 rule-based destination info tool.

Returns static metadata about a destination from an embedded dictionary.
No external API calls — keeps the engine fully offline for Phase 1.

In Phase 2+ this would query a travel database or maps API.
"""

from typing import Dict, Any

# ── Static destination knowledge base ─────────────────────────────────────────
# Keys are lower-cased destination names for case-insensitive lookup.
_DESTINATION_DB: Dict[str, Dict[str, Any]] = {
    "goa": {
        "destination": "Goa",
        "type": "beach",
        "best_months": ["November", "December", "January", "February"],
        "climate": "tropical",
        "language": "Konkani / English",
        "currency": "INR",
        "known_for": ["beaches", "nightlife", "seafood", "Portuguese heritage"],
        "tips": [
            "Rent a scooter to explore easily.",
            "Book accommodation early in peak season (Nov–Feb).",
            "Try local fish curry rice.",
        ],
    },
    "manali": {
        "destination": "Manali",
        "type": "mountain",
        "best_months": ["March", "April", "May", "October"],
        "climate": "alpine",
        "language": "Hindi / Pahari",
        "currency": "INR",
        "known_for": ["snow", "adventure sports", "Rohtang Pass", "Solang Valley"],
        "tips": [
            "Carry warm clothes even in summer.",
            "Acclimatise for a day before high-altitude excursions.",
            "Book Rohtang Pass permit in advance.",
        ],
    },
    "jaipur": {
        "destination": "Jaipur",
        "type": "heritage",
        "best_months": ["October", "November", "December", "February", "March"],
        "climate": "arid",
        "language": "Hindi / Rajasthani",
        "currency": "INR",
        "known_for": ["forts", "palaces", "Rajasthani cuisine", "handicrafts"],
        "tips": [
            "Visit Amber Fort early morning to avoid crowds.",
            "Bargain at local bazaars.",
            "Try dal baati churma.",
        ],
    },
    "kerala": {
        "destination": "Kerala",
        "type": "nature",
        "best_months": ["September", "October", "November", "December", "January"],
        "climate": "tropical",
        "language": "Malayalam",
        "currency": "INR",
        "known_for": ["backwaters", "houseboats", "Ayurveda", "spices"],
        "tips": [
            "Book a houseboat in Alleppey.",
            "Try a traditional Sadhya meal.",
            "Visit Munnar for tea plantations.",
        ],
    },
    "mumbai": {
        "destination": "Mumbai",
        "type": "city",
        "best_months": ["October", "November", "December", "January", "February"],
        "climate": "tropical",
        "language": "Marathi / Hindi / English",
        "currency": "INR",
        "known_for": ["Gateway of India", "street food", "Bollywood", "nightlife"],
        "tips": [
            "Use local trains for fast commuting.",
            "Try vada pav and pav bhaji.",
            "Visit Marine Drive at sunset.",
        ],
    },
}

# ── Default fallback for unknown destinations ──────────────────────────────────
_DEFAULT_DESTINATION = {
    "type": "mixed",
    "best_months": ["October", "November", "December"],
    "climate": "moderate",
    "language": "Hindi / English",
    "currency": "INR",
    "known_for": ["sightseeing", "culture", "local cuisine"],
    "tips": [
        "Check local travel advisories before visiting.",
        "Carry cash as some places may not accept cards.",
    ],
}


def get_destination_info(destination: str) -> Dict[str, Any]:
    """
    Return metadata for the given destination.

    Parameters
    ----------
    destination : str
        Name of the travel destination (case-insensitive).

    Returns
    -------
    dict
        Destination metadata dictionary.
    """
    key = destination.strip().lower()
    if key in _DESTINATION_DB:
        return _DESTINATION_DB[key]

    # Graceful fallback: partial match on any key
    for db_key, data in _DESTINATION_DB.items():
        if db_key in key or key in db_key:
            return data

    # Unknown destination — return a generic response
    fallback = dict(_DEFAULT_DESTINATION)
    fallback["destination"] = destination.strip().title()
    return fallback
