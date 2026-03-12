import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import prompts # Local file

load_dotenv()

app = FastAPI(title="Voyager AI Agent Engine")

class TripRequest(BaseModel):
    city: str
    days: int
    budget: float
    preferences: List[str]

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

@app.get("/health")
def health():
    return {"status": "AI Engine Online"}

@app.post("/ai/plan")
async def generate_plan(request: TripRequest):
    """
    Orchestrates multiple agents to generate a full travel plan.
    (In a real hackathon, this would call LLMs like GPT-4 or Gemini)
    """
    try:
        # Step 1: Destination Agent identifies spots
        # mock_data = call_llm(prompts.DESTINATION_AGENT_PROMPT.format(interests=request.preferences, city=request.city))
        
        # Step 2: Budget Agent calculates costs
        
        # Step 3: Itinerary Agent builds the schedule
        
        # Mock Response for now to allow Frontend development
        return {
            "status": "success",
            "itinerary": {
                "trip_summary": f"A delightful {request.days}-day escape to {request.city} focused on {', '.join(request.preferences)}.",
                "daily_plans": [
                    {
                        "day": 1,
                        "activities": [
                            {"time": "09:00", "place": "Local Cafe", "activity": "Traditional Breakfast", "cost_estimate": 15},
                            {"time": "11:00", "place": "City Landmark", "activity": "Cultural Tour", "cost_estimate": 40},
                            {"time": "19:00", "place": "Street Food Market", "activity": "Dinner & Exploration", "cost_estimate": 25}
                        ]
                    }
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/chat")
async def chat(request: ChatRequest):
    """
    Real-time chat endpoint for the AI Assistant Sidebar.
    """
    # Simply echo or mock logic until LLM keys are provided
    response_text = f"I've received your message: '{request.message}'. I'm analyzing how to adjust your {request.context.get('tripName', 'trip')} if needed."
    
    return {
        "reply": response_text,
        "actions": ["Update Itinerary", "Re-calculate Budget"] if "budget" in request.message.lower() else []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
