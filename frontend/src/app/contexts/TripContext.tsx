import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot, query, where, or } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "./AuthContext";

export type TripParticipant = {
  role: "owner" | "editor" | "viewer";
  joinedAt: string;
};

export type Trip = {
  id: string;
  name: string;
  image: string;
  dates: string;
  daysLeft: number;
  travelers: number;
  budget: { spent: number; total: number };
  location: string;
  status: string;
  statusBg: string;
  statusText: string;
  accentGradient: string;
  barColor: string;
  savedPlaces: number[];
  rawStartDate?: string;
  rawEndDate?: string;
  participants?: Record<string, TripParticipant>;
  participantIds?: string[];
  userId?: string; // owner uid
};

interface TripContextType {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, "id">) => void;
  savePlaceToTrip: (tripId: string, placeId: number) => void;
  removePlaceFromTrip: (tripId: string, placeId: number) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrips must be used within a TripProvider");
  return context;
};

const INITIAL_TRIPS: Trip[] = [
  {
    id: "trip-1",
    name: "Bali Retreat 2026",
    image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=1080",
    dates: "Oct 12 – 20, 2026",
    daysLeft: 214,
    travelers: 4,
    budget: { spent: 4500, total: 6000 },
    location: "Bali, Indonesia",
    status: "confirmed",
    statusBg: "bg-emerald-500",
    statusText: "Confirmed",
    accentGradient: "from-teal-400 to-cyan-500",
    barColor: "from-teal-400 to-cyan-400",
    savedPlaces: [1, 3],
    participantIds: []
  },
  {
    id: "trip-2",
    name: "Tokyo Neon Lights",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1080",
    dates: "Dec 5 – 15, 2026",
    daysLeft: 268,
    travelers: 2,
    budget: { spent: 2100, total: 5000 },
    location: "Tokyo, Japan",
    status: "planning",
    statusBg: "bg-amber-500",
    statusText: "Planning",
    accentGradient: "from-pink-500 to-rose-500",
    barColor: "from-amber-400 to-orange-400",
    savedPlaces: [],
    participantIds: []
  },
  {
    id: "trip-3",
    name: "Paris Getaway",
    image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&q=80&w=1080",
    dates: "May 1 – 8, 2026",
    daysLeft: 50,
    travelers: 3,
    budget: { spent: 1200, total: 3500 },
    location: "Paris, France",
    status: "upcoming",
    statusBg: "bg-indigo-500",
    statusText: "Upcoming",
    accentGradient: "from-indigo-500 to-purple-600",
    barColor: "from-indigo-400 to-purple-400",
    savedPlaces: [],
    participantIds: []
  }
];

export function TripProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);

  useEffect(() => {
    if (!currentUser) {
      setTrips(INITIAL_TRIPS);
      return;
    }

    const q = query(
      collection(db, "trips"),
      or(
        where("userId", "==", currentUser.uid),
        where("participantIds", "array-contains", currentUser.uid)
      )
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTrips: Trip[] = [];
      snapshot.forEach(docSnap => {
        fetchedTrips.push({ id: docSnap.id, ...docSnap.data() } as Trip);
      });
      
      // If the user has trips in the database, display them.
      // Otherwise fallback to INITIAL_TRIPS (but we won't write INITIAL_TRIPS to DB to avoid clutter)
      if (fetchedTrips.length > 0) {
        // sort trips by creation date or just reverse so newest is first
        fetchedTrips.sort((a: any, b: any) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        setTrips(fetchedTrips);
      } else {
        setTrips(INITIAL_TRIPS);
      }
    }, (error) => {
      console.error("Error fetching trips from Firestore:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTrip = async (tripData: Omit<Trip, "id">) => {
    const newTripId = `trip-${Date.now()}`;
    const newTrip = { ...tripData, id: newTripId };
    
    // locally optimistic
    setTrips(prev => [newTrip, ...prev]);

    if (currentUser) {
      try {
        await setDoc(doc(db, "trips", newTripId), {
          ...tripData,
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to add trip to Firestore:", err);
      }
    }
  };
  
  const savePlaceToTrip = async (tripId: string, placeId: number) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        if (!t.savedPlaces.includes(placeId)) {
          return { ...t, savedPlaces: [...t.savedPlaces, placeId] };
        }
      }
      return t;
    }));

    if (currentUser) {
      // Find what the new saved places array should be based on our state
      setTrips(prev => {
        const trip = prev.find(t => t.id === tripId);
        if (trip) {
          setDoc(doc(db, "trips", tripId), { savedPlaces: trip.savedPlaces }, { merge: true })
            .catch(err => console.error("Error updating saved places:", err));
        }
        return prev;
      });
    }
  };

  const removePlaceFromTrip = async (tripId: string, placeId: number) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        return { ...t, savedPlaces: t.savedPlaces.filter(id => id !== placeId) };
      }
      return t;
    }));

    if (currentUser) {
      setTrips(prev => {
        const trip = prev.find(t => t.id === tripId);
        if (trip) {
          setDoc(doc(db, "trips", tripId), { savedPlaces: trip.savedPlaces }, { merge: true })
            .catch(err => console.error("Error removing saved place:", err));
        }
        return prev;
      });
    }
  };

  return (
    <TripContext.Provider value={{ trips, addTrip, savePlaceToTrip, removePlaceFromTrip }}>
      {children}
    </TripContext.Provider>
  );
}
