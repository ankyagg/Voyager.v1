import json
from services.planning_service import run

print("=== Testing Phase 5: Dataset Intelligence ===")
print("Sending request for a trip to Bangalore with restaurants and hotels...")

# Make a request covering a city we assume has data
itinerary = run("Plan a 2 day trip to Bangalore under 15000 INR. Add some great local restaurants and highly rated hotels.")

print("\n\n=== Final Result ===")
print(itinerary.pretty_print())
