"""
utils/data_loader.py
─────────────────────
Dataset Intelligence Layer loader.
Lazily loads JSON datasets for attractions, restaurants, and hotels into memory.
"""

import json
import os

_DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets")

_attractions_db = None
_restaurants_db = None
_hotels_db = None

def _load_json_safe(filename: str) -> list:
    """Safe wrapper to load a JSON dataset file."""
    path = os.path.join(_DATASETS_DIR, filename)
    if not os.path.isfile(path):
        print(f"[DataLoader] Warning: {filename} not found at {path}")
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[DataLoader] Error loading {filename}: {e}")
        return []

def get_attractions_data() -> list:
    global _attractions_db
    if _attractions_db is None:
        _attractions_db = _load_json_safe("attractions.json")
    return _attractions_db

def get_restaurants_data() -> list:
    global _restaurants_db
    if _restaurants_db is None:
        _restaurants_db = _load_json_safe("restaurants.json")
    return _restaurants_db

def get_hotels_data() -> list:
    global _hotels_db
    if _hotels_db is None:
        _hotels_db = _load_json_safe("hotels.json")
    return _hotels_db
