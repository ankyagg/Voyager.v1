"""
tools/attraction_tool.py
─────────────────────────
Phase 1 rule-based attraction tool.

Returns a curated list of top attractions for a destination.
No external API calls — fully offline for Phase 1.

In Phase 2+ this would query a travel recommendation API or vector DB.
"""

from typing import List

# ── Static attraction knowledge base ──────────────────────────────────────────
# Keys are lower-cased destination names.
# Each value is a list ordered from most iconic → more niche.
_ATTRACTIONS_DB = {
    "goa": [
        "Baga Beach",
        "Calangute Beach",
        "Anjuna Flea Market",
        "Chapora Fort",
        "Dudhsagar Waterfalls",
        "Old Goa Churches (Basilica of Bom Jesus)",
        "Palolem Beach",
        "Spice Plantation tour",
        "Saturday Night Market (Arpora)",
        "Vagator Beach sunset",
    ],
    "manali": [
        "Solang Valley",
        "Rohtang Pass",
        "Hadimba Devi Temple",
        "Mall Road",
        "Beas River Rafting",
        "Naggar Castle",
        "Vashisht Hot Springs",
        "Great Himalayan National Park",
        "Hampta Pass Trek",
        "Kullu Valley sightseeing",
    ],
    "jaipur": [
        "Amber Fort",
        "City Palace",
        "Hawa Mahal",
        "Jantar Mantar Observatory",
        "Nahargarh Fort",
        "Johari Bazaar shopping",
        "Jal Mahal",
        "Albert Hall Museum",
        "Elephant Village (Amer)",
        "Chokhi Dhani cultural village",
    ],
    "kerala": [
        "Alleppey Backwaters Houseboat",
        "Munnar Tea Plantations",
        "Periyar Wildlife Sanctuary",
        "Varkala Beach",
        "Fort Kochi heritage walk",
        "Kathakali dance performance",
        "Athirapally Waterfalls",
        "Kovalam Beach",
        "Bekal Fort",
        "Thekkady spice garden",
    ],
    "mumbai": [
        "Gateway of India",
        "Marine Drive (Queen's Necklace)",
        "Elephanta Caves",
        "Colaba Causeway market",
        "Juhu Beach",
        "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
        "Dharavi slum tour",
        "Bandra-Worli Sea Link",
        "Sanjay Gandhi National Park",
        "Film City tour",
    ],
}

# ── Generic fallback attractions ───────────────────────────────────────────────
_DEFAULT_ATTRACTIONS = [
    "Old Town heritage walk",
    "Local market exploration",
    "National Museum visit",
    "Scenic viewpoint",
    "Traditional cuisine tasting",
    "Temple / religious site",
    "Nature park / garden",
    "Cultural performance",
    "Photography spots",
    "Souvenir shopping",
]


def get_attractions(destination: str, limit: int = 8) -> List[str]:
    """
    Return top attractions for the given destination.

    Parameters
    ----------
    destination : str
        Travel destination name (case-insensitive).
    limit : int
        Maximum number of attractions to return (default 8).
        Keeping this small constrains the prompt size for the local model.

    Returns
    -------
    list[str]
        List of attraction name strings.
    """
    key = destination.strip().lower()

    if key in _ATTRACTIONS_DB:
        return _ATTRACTIONS_DB[key][:limit]

    # Partial match
    for db_key, data in _ATTRACTIONS_DB.items():
        if db_key in key or key in db_key:
            return data[:limit]

    # Generic fallback with destination name injected
    dest_title = destination.strip().title()
    fallback = [f"{dest_title} {attr}" for attr in _DEFAULT_ATTRACTIONS]
    return fallback[:limit]
