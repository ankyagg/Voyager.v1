"""
tools/travel_tip_tool.py
─────────────────────────
Phase 2 — Rule-based local travel tips tool.

Returns curated, practical travel tips for a destination.
No external API — fully offline.
"""

from typing import List

# ── Travel tip knowledge base ──────────────────────────────────────────────────
_TIPS_DB = {
    "goa": [
        "Rent a scooter (₹300-500/day) — it is the best way to explore beaches.",
        "North Goa (Baga, Calangute) is lively and touristy; South Goa (Palolem) is quieter.",
        "Always bargain at Anjuna Flea Market — start at 40% of the asking price.",
        "Carry sunscreen — the Goan sun is intense even in December.",
        "Try Goan fish curry rice at a local restaurant, not just beach shacks.",
        "Book accommodation at least a month ahead for December-January.",
        "Respect beach shack rules — most close by midnight under government norms.",
        "Carry a waterproof bag for beach days — sudden sea breeze can soak belongings.",
    ],
    "manali": [
        "Carry warm clothing even in summer — mountain weather changes within hours.",
        "Acclimatise for half a day before high-altitude excursions like Rohtang Pass.",
        "Book the Rohtang Pass permit online (rohtangpermit.nic.in) — very limited quota.",
        "Old Manali across the river has better cafes and a more relaxed vibe than Mall Road.",
        "Try Sidu (local bread), Dham (Himachali feast), and Trout fish at local restaurants.",
        "Hire a trusted local guide for any Hampta Pass or Beas Kund treks.",
        "Carry cash — ATMs are unreliable in Rohtang or Solang Valley areas.",
        "For rafting on Beas River, use only government-certified operators near Pirdi.",
    ],
    "jaipur": [
        "Visit Amber Fort at opening time (8am) to beat the crowds and heat.",
        "Buy the composite ticket for City Palace + Jantar Mantar + Hawa Mahal for savings.",
        "Only bargain at bazaars — fixed-price shops in malls are not meant for bargaining.",
        "Respect temple dress codes — cover shoulders and knees at religious sites.",
        "Hire a government-licensed guide at Amber Fort — unofficial guides provide wrong info.",
        "Pyaaz Kachori at Rawat Mishthan Bhandar on MI Road is a legendary Jaipur breakfast.",
        "Auto-rickshaw meters are rarely used — fix the price before getting in.",
        "Watch out for gem-store touts near Hawa Mahal — a common tourist trap.",
    ],
    "kerala": [
        "Book houseboats directly at Alleppey jetty to avoid heavy agent commissions.",
        "Visit Periyar Wildlife Sanctuary on the early morning boat (6am) for best sightings.",
        "Pack light cotton clothes and strong mosquito repellent for backwater areas.",
        "Authentic Kathakali performances are held every evening in Fort Kochi.",
        "Try the traditional Sadhya meal on a banana leaf — best on Onam (August/September).",
        "Carry sufficient cash in Wayanad and Munnar — ATMs are scarce in remote areas.",
        "Toddy shops (kallu shaap) serve fresh palm wine — a unique local experience.",
        "Hire certified government guides at Periyar Tiger Reserve to ensure safety.",
    ],
    "ladakh": [
        "CRITICAL: Acclimatise for at least 24 hours in Leh before any high-altitude excursion.",
        "Carry Diamox (acetazolamide) tablets — consult a doctor before the trip.",
        "Inner Line Permit for Pangong, Nubra, and Hanle must be arranged in Leh (₹400+).",
        "Download offline maps (Maps.me or OsmAnd) — mobile signal is patchy on remote roads.",
        "Carry warm layers even in July/August — temperatures drop below 5°C at night.",
        "Fuel up fully in Leh — petrol pumps are sparse on the Manali-Leh highway.",
        "Drink 3-4 litres of water daily to counter dehydration at high altitude.",
        "Butter tea (Po Cha) helps with altitude adaptation despite its unusual salty taste.",
    ],
}

# Generic tips for unknown destinations
_DEFAULT_TIPS = [
    "Check travel advisories and entry requirements before departure.",
    "Carry a mix of cash and cards — not all places accept digital payments.",
    "Purchase comprehensive travel insurance before your trip.",
    "Download an offline map of the destination for areas with poor signal.",
    "Respect local customs, dress codes, and photography restrictions.",
    "Keep photocopies of important documents — passport, ID, and insurance.",
    "Try local street food, but drink only sealed bottled water.",
]


def get_travel_tips(destination: str, limit: int = 5) -> List[str]:
    """
    Return curated travel tips for a destination.

    Parameters
    ----------
    destination : str
        Destination name (case-insensitive).
    limit : int
        Maximum number of tips to return (default 5).

    Returns
    -------
    List[str]
        List of actionable travel tip strings.
    """
    key = destination.strip().lower()

    if key in _TIPS_DB:
        return _TIPS_DB[key][:limit]

    # Partial match
    for db_key, tips in _TIPS_DB.items():
        if db_key in key or key in db_key:
            return tips[:limit]

    # Unknown destination — return generic tips
    return _DEFAULT_TIPS[:limit]
