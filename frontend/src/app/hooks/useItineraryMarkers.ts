import { useState, useEffect } from "react";
import placesData from "../../data/places.json";

/**
 * Extracts a likely place name from a long AI-generated description.
 */
function extractPlaceName(title: string): string {
  // Strip markdown formatting
  const clean = title.replace(/\*\*/g, "").replace(/__/g, "").trim();
  
  // If already short, use as-is
  if (clean.length < 35) return clean;

  // Try a series of regex patterns, from most specific to least
  const patterns: RegExp[] = [
    // Pattern for "at the <Place> (" or "at <Place> ("
    /(?:at|to|in|visit|explore|see)\s+(?:the\s+)?(?:iconic\s+|famous\s+|historic(?:al)?\s+|beautiful\s+|stunning\s+|magnificent\s+|ancient\s+|popular\s+|renowned\s+)?([A-Z][A-Za-z'''\-]+(?:\s+[A-Za-z'''\-]+)*?)\s*[\(,\.]/,
    
    // Quoted text "Place Name"
    /"([^"]+)"/,
    
    // "visit/explore the <Place>"
    /(?:visit|explore|see|check out|discover|experience|head to|go to|walk to|drive to)\s+(?:the\s+)?(?:iconic\s+|famous\s+|historic(?:al)?\s+|beautiful\s+|stunning\s+|magnificent\s+|ancient\s+|popular\s+|renowned\s+)?([A-Z][A-Za-z'''\-]+(?:\s+[A-Za-z'''\-]+)*)/i,
    
    // Landmark suffix: "Something Temple/Fort/Museum/etc"
    /([A-Z][A-Za-z'''\-]+(?:\s+[A-Za-z'''\-]+)*?\s+(?:Temple|Fort|Palace|Museum|Church|Mosque|Garden|Park|Lake|Beach|Market|Waterfall|Cave|Caves|Tomb|Gate|Mahal|Dam|Zoo|Stadium|Center|Centre|Wada|Ghat|Mandir|Cemetery|Memorial|Tower|Bridge|Hill|Island|Falls|Point|Valley|Springs|Reservoir|Sanctuary|Reserve|Causeway|Drive|Sea Face|Promenade|Dargah|Station))/i,

    // Just find 2+ capitalized words in sequence
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      let extracted = match[1].trim();
      // Remove trailing common words
      extracted = extracted.replace(/\s+(is|are|was|were|has|have|had|a|an|the|and|or|but|for|with|from|by|in|on|at|to|of|that|this|which|where|when|how|one|it)$/i, "").trim();
      if (extracted.length > 3 && extracted.length < 80) {
        return extracted;
      }
    }
  }

  // Fallback cleanup
  const beforeParen = clean.split(/[,(]/)[0].trim();
  const cleaned = beforeParen
    .replace(/^(start|head|begin|go|walk|drive|take|experience|discover|enjoy|spend|end|finish|continue|proceed|make|have|grab|sample|stroll|wander|immerse|explore|visit|see|admire|capture|witness|watch|attend|join|participate|relax|unwind|indulge)\s+/i, "")
    .replace(/^(your|the|a|an|some|this)\s+(day|morning|afternoon|evening|night|time|trip|journey|visit|exploration)\s+/i, "")
    .replace(/^(at|to|in|on|with|by|for|from|into|through)\s+(the\s+)?/i, "")
    .replace(/^(iconic|famous|historic|historical|beautiful|stunning|magnificent|ancient|popular|renowned|breathtaking|spectacular|impressive|majestic|charming|vibrant|bustling|serene|tranquil|picturesque|scenic|lovely|gorgeous|grand|splendid|well-known|delicious|unique|rich|cultural)\s+/i, "")
    .replace(/^(city's\s+)/i, "")
    .trim();

  return cleaned || clean.substring(0, 50);
}

export function useItineraryMarkers(itinerary: any[], tripLocation: string) {
  const [itineraryMarkers, setItineraryMarkers] = useState<any[]>([]);
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);
  const [baseCoords, setBaseCoords] = useState<[number, number] | null>(null);

  // 1. Geocode the base location (city)
  useEffect(() => {
    if (!tripLocation) return;
    
    const geocodeBase = async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(tripLocation)}&format=jsonv2&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          setBaseCoords([parseFloat(data[0].lon), parseFloat(data[0].lat)]);
        }
      } catch (e) {
        console.error("❌ Base geocoding failed", e);
      }
    };
    geocodeBase();
  }, [tripLocation]);

  // 2. Geocode itinerary stops
  useEffect(() => {
    if (!itinerary || itinerary.length === 0) {
      setItineraryMarkers([]);
      setMapCoords(null);
      return;
    }

    const allStops = itinerary.flatMap((day: any) => day.stops);
    if (allStops.length === 0) {
      setItineraryMarkers([]);
      setMapCoords(null);
      return;
    }

    const geocodeStops = async () => {
      const markers: any[] = [];
      const MAX_STOPS = 30;
      const stopsToProcess = allStops.slice(0, MAX_STOPS);

      for (const stop of stopsToProcess) {
        let lat: number | null = null;
        let lng: number | null = null;

        const placeName = extractPlaceName(stop.title);
        
        // --- Geocoder Garbage Filter ---
        const lowerName = placeName.toLowerCase();
        if (lowerName.includes("total") || 
            lowerName.includes("budget") || 
            lowerName.includes("tip") ||
            lowerName === "day" ||
            placeName.length < 3) {
          console.log(`⏭️ skipping geocoding for non-place: "${placeName}"`);
          continue;
        }

        console.log(`🏷️ Geocoding: "${placeName}"`);

        // 1. Check local dataset first
        const localMatch = (placesData as any[]).find((p: any) => {
          if (!p.Name || !p.latitude || !p.longitude) return false;
          const dbName = p.Name.toLowerCase();
          return dbName === lowerName || 
                 (lowerName.includes(dbName) && dbName.length > 5) ||
                 (stop.title.toLowerCase().includes(dbName) && dbName.length > 5);
        });

        if (localMatch) {
          lat = parseFloat(localMatch.latitude);
          lng = parseFloat(localMatch.longitude);
          console.log(`✅ Local match: ${placeName}`);
        }

        // 2. Multi-step Nominatim fallback
        if (lat === null || lng === null) {
          // Try ONLY city-specific query first to be safe and accurate
          const queries = [
            `${placeName}, ${tripLocation}`,
            `${placeName}, India`
          ];

          for (const query of queries) {
            try {
              // Using search.php which is sometimes more permissive for CORS
              const res = await fetch(`/api/geocode/search.php?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`);
              
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lng = parseFloat(data[0].lon);
                console.log(`✅ Nominatim match [${query}]: ${placeName}`);
                break;
              }
            } catch (e: any) {
              console.warn(`⚠️ Nominatim failed [${query}]: ${e.message}`);
              // If we hit CORS or rate limit, wait longer
              if (e.name === 'TypeError') {
                 console.log("⏸️ Waiting 2s (possible CORS/Rate Limit)...");
                 await new Promise(r => setTimeout(r, 2000));
              }
            }
            await new Promise(r => setTimeout(r, 800)); // Internal loop delay
          }

          // Total wait to respect 1req/sec + overhead
          await new Promise(r => setTimeout(r, 1200));
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          markers.push({
            id: stop.id,
            title: placeName,
            lat,
            lng,
            time: stop.time,
            type: stop.type
          });
        }
      }

      setItineraryMarkers(markers);
      if (markers.length > 0) {
        setMapCoords([markers[0].lng, markers[0].lat]);
      }
    };

    geocodeStops();
  }, [itinerary, tripLocation]);

  return { itineraryMarkers, mapCoords, baseCoords };
}
