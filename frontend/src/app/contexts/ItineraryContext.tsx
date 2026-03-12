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

  // Split by "Day N:" lines
  const dayChunks = markdown.split(/\n(?=day\s+\d+[:–—])/i);

  dayChunks.forEach((chunk) => {
    const dayMatch = chunk.match(/day\s+(\d+)[:–—]\s*(.*)/i);
    if (!dayMatch) return;

    const dayNumber = parseInt(dayMatch[1], 10);
    const stops: ItineraryStop[] = [];

    const lines = chunk.split("\n").slice(1); // skip the "Day N:" line itself

    const timePrefixes: Record<string, string> = {
      morning: "09:00 AM",
      afternoon: "01:00 PM",
      evening: "06:00 PM",
      night: "09:00 PM",
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().startsWith("budget")) return;

      // Strip ALL bold/italic markdown first so we get plain text
      const cleanLine = trimmed.replace(/\*\*/g, "").replace(/__/g, "");

      // Detect time-of-day prefix like "Morning: Visit..." or "- Morning: Visit..."
      const timeMatch = cleanLine.match(/^(?:[-*•]\s*)?(morning|afternoon|evening|night)[:\s]+(.+)/i);
      if (timeMatch) {
        const timeKey = timeMatch[1].toLowerCase();
        const title = timeMatch[2].trim();
        if (title.length > 3) {
          stops.push({
            id: `day${dayNumber}-${stops.length}-${Math.random().toString(36).substr(2, 6)}`,
            time: timePrefixes[timeKey] || "09:00 AM",
            title,
            type: "activity",
            duration: "2h",
          });
        }
        return;
      }

      // Detect bullet points like "- Visit..."
      const bulletMatch = cleanLine.match(/^[-*•]\s+(.+)/);
      if (bulletMatch) {
        const title = bulletMatch[1].trim();
        // Skip budget lines
        if (title.toLowerCase().startsWith("budget") || title.toLowerCase().includes("estimated daily budget")) return;
        if (title.length > 3) {
          // Fallback time math if there was no Morning/Afternoon prefix
          let hour = 9 + stops.length * 2;
          if (hour > 23) hour = 23; // Prevent 24+ hour bugs!
          
          let ampm = "AM";
          let displayHour = hour;
          if (hour >= 12) {
            ampm = "PM";
            if (hour > 12) displayHour = hour - 12;
          }
          if (displayHour === 0) displayHour = 12;

          stops.push({
            id: `day${dayNumber}-${stops.length}-${Math.random().toString(36).substr(2, 6)}`,
            time: `${String(displayHour).padStart(2, "0")}:00 ${ampm}`,
            title,
            type: "activity",
            duration: "2h",
          });
        }
        return;
      }
    });


    if (stops.length > 0) {
      days.push({
        day: dayNumber,
        date: `Day ${dayNumber}`,
        stops,
      });
    }
  });

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
