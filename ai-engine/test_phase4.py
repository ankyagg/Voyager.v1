import json
from services.planning_service import run

print("=== Generating Initial Itinerary ===")
initial_itinerary = run("Plan a 2 day trip to Jaipur under 10000 INR")
initial_dict = json.loads(initial_itinerary.model_dump_json())

print("\n\n=== Requesting Modification ===")
print("User: Remove museum from day 1 and replace it with a shopping activity in the evening.")
modified_itinerary = run("Remove museum from day 1 and replace it with a shopping activity in the evening.", existing_itinerary=initial_dict)

print("\n\n=== Final Result ===")
print(modified_itinerary.pretty_print())
