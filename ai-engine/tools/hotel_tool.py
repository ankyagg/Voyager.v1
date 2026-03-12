"""
tools/hotel_tool.py
────────────────────
Dataset-powered hotel tool.

Returns a curated list of top hotels for a destination.
"""

from typing import List, Dict, Any
import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from utils.data_loader import get_hotels_data

def search_hotels(city: str) -> List[Dict[str, Any]]:
    """
    Search hotels by city.
    """
    data = get_hotels_data()
    city_lower = city.strip().lower()
    
    results = []
    for row in data:
        # Check city or state
        row_city_raw = str(row.get("city", row.get("City", row.get("locality", row.get("state", "")))))
        row_city = row_city_raw.strip().lower()
        
        # simple inclusion match
        if not (city_lower in row_city or row_city in city_lower):
            continue
            
        # Parse rating
        rate_str = str(row.get("site_review_rating", "0")).split("/")[0].strip()
        try:
            rating = float(rate_str)
        except ValueError:
            rating = 0.0
            
        # Parse star
        star_str = str(row.get("hotel_star_rating", "0")).split(" ")[0]
        try:
            star = float(star_str)
        except ValueError:
            star = 0.0
            
        # If no rating, heavily penalize or skip if too many
        results.append({
            "name": row.get("property_name", "Unknown Hotel"),
            "rating": rating,
            "stars": star,
            "location": row_city_raw
        })
            
    # Sort by rating heavily, and cost secondarily
    results.sort(key=lambda x: (-x["rating"], -x["stars"]))
    
    return results[:10]
