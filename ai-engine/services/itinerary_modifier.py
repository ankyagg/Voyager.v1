"""
services/itinerary_modifier.py
───────────────────────────────
Phase 4 — Itinerary Modification Service

Orchestrates the modification of an existing itinerary based on a user's request.
Re-utilizes RAG and tools to apply precise updates to a target day or overall plan.
"""

import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from agents import modification_agent
from agents import itinerary_agent
from tools import attraction_tool, weather_tool, budget_tool
from services.rag_service import build_rag_context, is_rag_ready
from schemas.itinerary_schema import Itinerary

def run_modification(user_request: str, existing_itinerary: dict) -> Itinerary:
    """
    Run the modification pipeline to update an existing itinerary.
    """
    print("\n[Modification Pipeline] Starting...")

    # 1. Parse modification instruction
    mod_instruction = modification_agent.parse_modification(user_request)
    
    # Extract existing context
    destination = existing_itinerary.get("destination", "Unknown")
    duration_days = existing_itinerary.get("duration_days", 3)
    preferences = existing_itinerary.get("preferences", [])
    
    # 2. Integrate tools context if needed
    tool_outputs = {}
    
    if mod_instruction.operation in ["add", "replace"]:
        print(f"  Tool: attraction_tool — fetching new attractions for {destination}...")
        attractions = attraction_tool.get_attractions(destination, limit=5)
        tool_outputs["attractions"] = attractions
        
    if mod_instruction.operation == "adjust_budget":
        print(f"  Tool: budget_tool — recalculating budget...")
        budget_info = budget_tool.estimate_budget(
            destination=destination,
            duration_days=duration_days,
            budget_constraint=mod_instruction.details or "default",
            destination_type="mixed"
        )
        tool_outputs["budget_info"] = budget_info

    # 3. RAG Retrieval context
    rag_context = ""
    if is_rag_ready():
        print("  RAG Service — retrieving targeted travel knowledge...")
        search_query = [destination, mod_instruction.activity, mod_instruction.details]
        search_term = " ".join([q for q in search_query if q])
        rag_context = build_rag_context(search_term, preferences)

    # 4. Apply Modification via Itinerary Agent
    print(f"  Itinerary Agent — updating day {mod_instruction.target_day} plan...")
    updated_itinerary = itinerary_agent.modify_itinerary(
        existing_itinerary=existing_itinerary,
        modification_instruction=mod_instruction.model_dump(),
        rag_context=rag_context,
        tool_outputs=tool_outputs
    )

    print("\n[Modification Pipeline] Complete!")
    return updated_itinerary
