import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export type ItineraryStop = {
  id: string;
  time: string;
  title: string;
  type: string;
  duration: string;
};

export type ItineraryDay = {
  day: number;
  date: string;
  stops: ItineraryStop[];
};

interface ItineraryContextType {
  itinerary: ItineraryDay[];
  setItinerary: (days: ItineraryDay[]) => void;
  applyFromMarkdown: (markdown: string) => void;
}

export const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const useItinerary = () => {
  const ctx = useContext(ItineraryContext);
  if (!ctx) throw new Error("useItinerary must be used within ItineraryProvider");
  return ctx;
};

// ------- Parse AI Markdown into ItineraryDay[] --------------------------------
// Handles patterns like:
//   "Day 1: Arrival and Local Flavors"
//   "Morning: Visit xyz"  or  "- Visit xyz"  or  "* Visit xyz"
// -------------------------------------------------------------------------------
function parseMarkdownToItinerary(markdown: string): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  console.log("📄 Parsing markdown to itinerary...", markdown.length, "chars");

  // Robust splitting: handles "Day 1:", "Day 1 -", "Day 1: " or just "Day 1" on a newline
  const chunks = markdown.split(/\n(?=day\s+\d+)/i);
  
  // If no "Day N" markers found, the whole thing is one day or invalid
  const dayChunks = chunks.filter(c => c.toLowerCase().includes("day"));

  dayChunks.forEach((chunk) => {
    // Aggressive match for the day header
    const dayHeaderMatch = chunk.match(/day\s+(\d+)(?:[:–—\s.-]*)?(.*)/i);
    if (!dayHeaderMatch) return;

    const dayNumber = parseInt(dayHeaderMatch[1], 10);
    const stops: ItineraryStop[] = [];

    const lines = chunk.split("\n");

    const timePrefixes: Record<string, string> = {
      morning: "09:00 AM",
      afternoon: "01:00 PM",
      evening: "06:00 PM",
      night: "09:00 PM",
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      // Skip headers, empty lines, or budget noise
      if (!trimmed || /day\s+\d+/i.test(trimmed) || trimmed.toLowerCase().startsWith("budget")) return;

      // Clean markdown bold/italic
      const cleanLine = trimmed.replace(/\*\*|_/g, "");

      // Match time prefixes first: "Morning: visit X"
      const timeMatch = cleanLine.match(/^(?:[-*•]\s*)?(morning|afternoon|evening|night)[:\s]+(.+)/i);
      
      let title = "";
      let time = "09:00 AM";

      if (timeMatch) {
        title = timeMatch[2].trim();
        time = timePrefixes[timeMatch[1].toLowerCase()] || "09:00 AM";
      } else {
        // Fallback to bullet points or any text line that looks like an activity
        const bulletMatch = cleanLine.match(/^(?:[-*•]\s+)?(.+)/);
        if (bulletMatch) {
          title = bulletMatch[1].trim();
          // Skip lines that are just descriptive paragraphs (too long) or meta
          if (title.length > 200 || title.toLowerCase().includes("itinerary")) return;
          
          let hour = 9 + (stops.length * 2);
          if (hour > 23) hour = 23;
          time = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        }
      }

      if (title && title.length > 2) {
        const lowerTitle = title.toLowerCase();
        
        // 1. Skip budget-related lines (more aggressive check)
        if (lowerTitle.includes("estimated budget") || 
            lowerTitle.includes("total cost") || 
            lowerTitle.includes("cost per person") ||
            /^total[:\s]/.test(lowerTitle) ||
            /₹\d+/.test(title)) { // If it's just a price line, skip
          console.log(`⏭️ Skipping budget line: "${title}"`);
          return;
        }

        // 2. Comprehensive Tip/Noise Filter
        // Only skip if it's VERY clearly not a place (generic advice)
        const landmarkKeywords = /temple|fort|palace|museum|church|mosque|garden|park|lake|beach|market|waterfall|cave|gate|mahal|dam|zoo|stadium|wada|ghat|mandir|cemetery|memorial|tower|bridge|hill|island|falls|point|valley|springs|dargah|neighborhood|causeway/i;
        
        const isAction = /^(visit|explore|see|check out|discover|experience|head to|go to|walk to|drive to|start|enjoy|begin|end)/i.test(lowerTitle);
        const hasLandmark = landmarkKeywords.test(lowerTitle);

        const isTip = /^(remember|make sure|keep in mind|carry|wear|bring|pack|drink|avoid|note|pro tip|tip:|be prepared|dress|don't forget)/i.test(lowerTitle)
          || /^(sunscreen|comfortable shoes|hydration|public transport|ride-hailing|getting around)/i.test(lowerTitle);

        // If it's a long line (desc) but starts with an action or has a landmark, we KEEP it
        if (isTip && !(isAction || hasLandmark)) {
          console.log(`⏭️ Skipping tip: "${title.substring(0, 50)}..."`);
          return;
        }
        
        // Even if it says nothing special, if it's too long and no landmark/action, skip
        if (title.length > 150 && !(isAction || hasLandmark)) {
          console.log(`⏭️ Skipping description paragraph: "${title.substring(0, 50)}..."`);
          return;
        }

        stops.push({
          id: `day${dayNumber}-${stops.length}-${Math.random().toString(36).substr(2, 6)}`,
          time,
          title: title.slice(0, 120),
          type: "activity",
          duration: "2h",
        });
      }
    });

    if (stops.length > 0) {
      days.push({
        day: dayNumber,
        date: `Day ${dayNumber}`, // Could be improved if we had a start date
        stops,
      });
    }
  });

  console.log("✅ Parsed", days.length, "days with total", days.reduce((acc, d) => acc + d.stops.length, 0), "stops.");
  return days;
}

export function ItineraryProvider({ children, tripId }: { children: ReactNode; tripId?: string }) {
  const [itinerary, setItineraryState] = useState<ItineraryDay[]>([]);

  // Listen to Firebase itinerary changes
  useEffect(() => {
    if (!tripId) return;

    const unsub = onSnapshot(doc(db, "trips", tripId), (snapshot) => {
      const data = snapshot.data();
      if (data?.itinerary) {
         setItineraryState(data.itinerary as ItineraryDay[]);
      }
    });

    return () => unsub();
  }, [tripId]);

  // Sync state to Firebase whenever we want to update it
  const setItinerary = (newItin: ItineraryDay[]) => {
    setItineraryState(newItin);
    if (tripId) {
       setDoc(doc(db, "trips", tripId), { itinerary: newItin }, { merge: true })
         .catch(err => console.error("Failed to save itinerary:", err));
    }
  };

  const applyFromMarkdown = (markdown: string) => {
    const parsed = parseMarkdownToItinerary(markdown);
    if (parsed.length > 0) {
      setItinerary(parsed);
    }
  };

  return (
    <ItineraryContext.Provider value={{ itinerary, setItinerary, applyFromMarkdown }}>
      {children}
    </ItineraryContext.Provider>
  );
}
