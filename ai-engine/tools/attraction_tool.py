"""
tools/attraction_tool.py
─────────────────────────
Dataset-powered attraction tool.

Returns a curated list of top attractions for a destination from the structured dataset.
"""

from typing import List, Dict, Any
import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from utils.data_loader import get_attractions_data

# ── Generic fallback attractions ──
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

def search_attractions(city: str, min_rating: float = 4.0) -> List[Dict[str, Any]]:
    """
    Search attractions by city and minimum rating.
    """
    data = get_attractions_data()
    city_lower = city.strip().lower()
    
    results = []
    for row in data:
        # Match city (some datasets might use "City" or "State" or "location")
        row_city = str(row.get("City", row.get("State", ""))).strip().lower()
        if city_lower in row_city or row_city in city_lower:
            # Check rating
            try:
                rating = float(row.get("Google review rating", 0))
            except (ValueError, TypeError):
                rating = 0.0
                
            if rating >= min_rating:
                results.append({
                    "name": row.get("Name", "Unknown"),
                    "type": row.get("Type", "Attraction"),
                    "rating": rating,
                    "time_needed_hrs": row.get("time needed to visit in hrs", "Unknown")
                })
                
    # Sort by rating descending
    results.sort(key=lambda x: x["rating"], reverse=True)
    return results[:10]

def get_attractions(destination: str, limit: int = 8) -> List[str]:
    """
    Legacy wrapper for existing pipeline compatibility.
    """
    results = search_attractions(destination, min_rating=4.0)
    
    if not results:
        # Generic fallback with destination name injected
        dest_title = destination.strip().title()
        fallback = [f"{dest_title} {attr}" for attr in _DEFAULT_ATTRACTIONS]
        return fallback[:limit]
        
    return [f"{r['name']} ({r['type']}, {r['rating']}★)" for r in results][:limit]
