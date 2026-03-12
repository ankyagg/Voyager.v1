"""
tools/restaurant_tool.py
─────────────────────────
Dataset-powered restaurant tool.

Returns a curated list of top restaurants for a destination matching budget.
"""

from typing import List, Dict, Any
import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from utils.data_loader import get_restaurants_data

def search_restaurants(city: str, budget: float = 1000.0) -> List[Dict[str, Any]]:
    """
    Search restaurants by city and maximum budget (approx cost for two).
    """
    data = get_restaurants_data()
    city_lower = city.strip().lower()
    
    results = []
    for row in data:
        # Match city or location or address
        row_city_raw = str(row.get("listed_in(city)", "")) + " " + str(row.get("location", "")) + " " + str(row.get("address", ""))
        row_city = row_city_raw.strip().lower()
        
        # simple inclusion match
        if not (city_lower in row_city or row_city in city_lower):
            continue
            
        # Parse rating
        rate_str = str(row.get("rate", "0")).split("/")[0].strip()
        try:
            rating = float(rate_str)
        except ValueError:
            rating = 0.0
            
        # Parse cost
        cost_str = str(row.get("approx_cost(for two people)", 0)).replace(",", "")
        try:
            cost = float(cost_str)
        except ValueError:
            cost = float('inf')
            
        # Optional: check budget tolerance
        if cost <= budget * 2:  # Assume budget is per person, cost is for two.
            results.append({
                "name": row.get("name", "Unknown"),
                "cuisines": row.get("cuisines", "Mixed"),
                "rating": rating,
                "cost_for_two": cost,
                "location": row_city_raw
            })
            
    # Sort by rating heavily, and cost secondarily
    results.sort(key=lambda x: (-x["rating"], x["cost_for_two"]))
    
    return results[:10]
