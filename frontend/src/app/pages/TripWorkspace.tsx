import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { doc, setDoc, onSnapshot, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Calendar, MapPin, Wallet, Pencil, ChevronRight, MessageSquare, Image as ImageIcon, Map, MessageCircle, Users, Sparkles, Activity, BarChart2, CheckSquare, Lightbulb, FileText, Share2, Send } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTrips } from "../contexts/TripContext";
import ItineraryPlanner from "../components/ItineraryPlanner";
import BudgetTracker from "./BudgetTracker";
import DestinationDiscovery from "./DestinationDiscovery";
import { Map as MapComponent, MapMarker, MarkerContent, MarkerPopup, MapControls } from "@/components/ui/map";
import { ItineraryProvider, useItinerary } from "../contexts/ItineraryContext";
import { useItineraryMarkers } from "../hooks/useItineraryMarkers";

export default function TripWorkspace() {
  const { tripId } = useParams();
  const { trips } = useTrips();
  const { currentUser } = useAuth();
  const [activeTrip, setActiveTrip] = useState<any>(trips.find(t => t.id === tripId));
  const [loading, setLoading] = useState(!activeTrip);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!tripId) return;

    // Fast path: if found in context, use it immediately
    const found = trips.find(t => t.id === tripId);
    if (found) {
      setActiveTrip(found);
      setLoading(false);
    }

    // Subscribe to the specific trip document for real-time updates (important for shared links)
    const unsub = onSnapshot(doc(db, "trips", tripId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as any;
        setActiveTrip(data);
        setLoading(false);

        // Auto-join if user is logged in and not already a participant
        if (currentUser && data.userId !== currentUser.uid) {
          const pIds = data.participantIds || [];
          if (!pIds.includes(currentUser.uid)) {
            updateDoc(doc(db, "trips", tripId), {
              participantIds: arrayUnion(currentUser.uid),
              [`participants.${currentUser.uid}`]: {
                role: "editor",
                joinedAt: new Date().toISOString()
              }
            });
          }
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [tripId, trips, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-bold animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-500/20 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-6">
          <MapPin size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Trip Not Found</h2>
        <p className="text-muted-foreground text-center max-w-sm mb-8">
          The trip you are looking for might have been deleted, or you don't have permission to view it.
        </p>
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const trip = activeTrip;

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "itinerary", label: "Itinerary", icon: Calendar },
    { id: "destinations", label: "Destinations", icon: MapPin },
    { id: "budget", label: "Budget", icon: BarChart2 },
    { id: "discussion", label: "Discussion", icon: MessageCircle },
    { id: "suggestions", label: "Suggestions", icon: Lightbulb },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
  ];
  const [liveUsers, setLiveUsers] = useState<any[]>([]);

  // 1. Presence Heartbeat
  useEffect(() => {
    if (!tripId || !currentUser) return;

    const userName = currentUser.displayName?.split(" ")[0] || "Explorer";
    const userInitials = userName.slice(0, 2).toUpperCase();
    const colors = ["from-indigo-400 to-violet-500", "from-teal-400 to-cyan-500", "from-rose-400 to-pink-500", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500"];
    const colorHash = currentUser.uid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    const updatePresence = () => {
      setDoc(doc(db, "trips", tripId, "collab", "presence"), {
        [currentUser.uid]: {
          name: userName,
          initials: userInitials,
          color: colors[colorHash],
          lastSeen: Date.now()
        }
      }, { merge: true });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 10000); // 10s heartbeat

    return () => clearInterval(interval);
  }, [tripId, currentUser]);

  // 2. Presence Listener
  useEffect(() => {
    if (!tripId) return;
    const unsub = onSnapshot(doc(db, "trips", tripId, "collab", "presence"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = Date.now();
        const active = Object.values(data).filter((u: any) => now - u.lastSeen < 25000); // 25s threshold
        setLiveUsers(active);
      }
    });
    return () => unsub();
  }, [tripId]);
  return (
    <div className="min-h-full bg-background pb-12">
      {/* ===== TRIP HERO HEADER ===== */}
      <div className="relative">
        {/* Background Image strip */}
        <div className="h-48 relative overflow-hidden">
          <img
            src={trip.image}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />

          {/* Breadcrumb */}
          <div className="absolute top-6 left-8 flex items-center gap-2 text-white/70 text-xs font-semibold">
            <span className="hover:text-white cursor-pointer transition-colors">My Trips</span>
            <ChevronRight size={14} />
            <span className="text-white">{trip.name}</span>
          </div>

          {/* Edit & Share buttons */}
          <div className="absolute top-5 right-8 flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Trip link copied to clipboard! Share it with your friends to collaborate.");
              }}
              className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur border border-indigo-400/30 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg"
            >
              <Share2 size={13} /> Share Trip
            </button>
            <button className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all">
              <Pencil size={13} /> Edit Trip
            </button>
          </div>
        </div>

        {/* Content overlay */}
        <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-8">
            {/* Trip info row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 -mt-8 relative">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold font-heading text-foreground">{trip.name}</h1>
                  <span className={`px-2.5 py-1 ${trip.statusBg} text-white rounded-full text-[11px] font-bold uppercase tracking-wider`}>
                    {trip.statusText}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
                    <Calendar size={13} className="text-indigo-500" />
                    <span className="font-medium">{trip.dates}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
                    <MapPin size={13} className="text-rose-500" />
                    <span className="font-medium">{trip.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
                    <Wallet size={13} className="text-teal-500" />
                    <span className="font-semibold text-foreground">${trip.budget.spent.toLocaleString()}</span>
                    <span className="text-muted-foreground">/ ${trip.budget.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Collaborators */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex -space-x-2">
                  {liveUsers.map((user, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.color} border-2 border-card flex items-center justify-center text-white text-[10px] font-bold shadow-sm cursor-pointer hover:scale-110 transition-transform z-${30 - i * 5} ring-2 ring-emerald-500/20`}
                      title={user.name}
                    >
                      {user.initials}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Trip link copied! Share with friends to invite them.");
                    }}
                    className="w-9 h-9 rounded-full bg-muted border-2 border-card text-muted-foreground text-xs font-bold hover:bg-accent transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-indigo-500" />
                    <span className="text-foreground font-bold">{(trip.participantIds?.length || 0) + 1}</span>
                  </div>
                  <span className="opacity-60">travelers</span>
                  <div className="w-1 h-1 rounded-full bg-border mx-1" />
                  <span className="text-emerald-500 font-bold">{liveUsers.length} live</span>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 pt-2 px-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 rounded-t-lg ${activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <ItineraryProvider tripId={trip.id}>
        <div className="bg-background mt-6">
          {activeTab === "overview" && <TripOverview trip={trip} />}
          {activeTab === "itinerary" && <ItineraryPlanner trip={trip} />}
          {activeTab === "destinations" && <DestinationDiscovery context="trip" tripIdForContext={trip.id} />}
          {activeTab === "budget" && <BudgetTracker />}
          {activeTab === "discussion" && <TripDiscussion trip={trip} liveUsers={liveUsers} />}
          {activeTab === "suggestions" && <TripSuggestions trip={trip} />}
          {activeTab === "notes" && <TripNotes trip={trip} />}
          {activeTab === "tasks" && <TripTasks trip={trip} />}
        </div>
      </ItineraryProvider>
    </div>
  );
}

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
    }
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }]
};

function TripOverview({ trip }: { trip: any }) {
  const [mapProvider, setMapProvider] = useState<"carto" | "osm">("carto");
  const { dbUser: _dbUser } = useAuth();
  
  // Get active itinerary
  const { itinerary } = useItinerary();
  // Get markers and coordinates
  const { itineraryMarkers, mapCoords, baseCoords } = useItineraryMarkers(itinerary, trip?.location);
  const nextActivities = itinerary.flatMap(day => day.stops).slice(0, 3);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([115.1889, -8.4095]);

  useEffect(() => {
    if (mapCoords) {
      setMapCenter(mapCoords);
    } else if (baseCoords) {
      setMapCenter(baseCoords);
    }
  }, [mapCoords, baseCoords]);



  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
      {/* Left Column: Map + Upcoming */}
      <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">

        {/* Map Card */}
        <div className="bg-card rounded-[2rem] overflow-hidden shadow-xl shadow-indigo-900/5 dark:shadow-black/40 border border-border/60 flex flex-col group relative">
          {/* Map Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-5 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2 drop-shadow-md">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Map className="text-white" size={16} />
              </div>
              Trip Map
            </h2>
            <div className="flex gap-1.5 pointer-events-auto bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl">
              {(["carto", "osm"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setMapProvider(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mapProvider === p
                      ? "bg-white text-black shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {p === "carto" ? "Carto" : "OSM"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] md:h-[550px] lg:h-[600px] relative w-full">
            <MapComponent
              key={mapCenter.join(',')}
              center={mapCenter}
              zoom={10}
              className="w-full h-full object-cover"
              styles={mapProvider === "osm" ? { light: OSM_STYLE, dark: OSM_STYLE } : undefined}
            >
              <MapControls position="bottom-right" />
              {itineraryMarkers.map((marker, idx) => (
                <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
                  <MarkerContent>
                    <div className="relative group cursor-pointer scale-110">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                      <div className="relative w-8 h-8 bg-white dark:bg-indigo-950 rounded-xl rotate-45 border-2 border-indigo-600 shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-all">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 -rotate-45">{idx + 1}</span>
                      </div>
                    </div>
                  </MarkerContent>
                  <MarkerPopup>
                    <div className="p-3 bg-card min-w-[200px] rounded-2xl border border-border/50 shadow-xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{marker.type}</p>
                      <h4 className="font-bold text-sm text-foreground mb-1">{marker.title}</h4>
                      <p className="text-xs text-indigo-600 font-bold">{marker.time}</p>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ))}
            </MapComponent>

            {/* Floating Map Label */}
            <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-[#13132B]/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 flex items-center gap-3 pointer-events-none ring-1 ring-black/5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <p className="font-bold text-sm text-foreground leading-none">{trip.location}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1 tracking-wider">Base Camp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Activities - Horizontal layout for larger screens */}
        <div className="bg-card rounded-[2rem] p-6 md:p-8 shadow-xl shadow-indigo-900/5 dark:shadow-black/40 border border-border/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="text-amber-600 dark:text-amber-400" size={16} />
              </div>
              Up Next
            </h2>
            <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1">
              View Itinerary <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextActivities.length > 0 ? (
              nextActivities.map((stop, idx) => (
                <div key={stop.id} className="flex flex-col gap-4 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-white dark:from-[#1E1E3F] dark:to-[#13132B] shadow-sm hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/20">
                      {idx + 1}
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                      {stop.type}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight mb-1.5 text-indigo-900 dark:text-indigo-100 line-clamp-2">{stop.title}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{stop.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-10 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
                <p className="text-sm text-muted-foreground italic">No activities planned yet. Go to the Itinerary tab to start planning!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Activity Feed */}
      <div className="xl:col-span-4 flex flex-col">
        <TripActivityFeed trip={trip} />
      </div>
    </div>
  );
}

function TripDiscussion({ trip, liveUsers }: { trip: any, liveUsers: any[] }) {
  const { dbUser, currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const initials = dbUser?.displayName ? dbUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "E";
  const fullName = dbUser?.displayName || "Explorer";

  useEffect(() => {
    if (!trip?.id) return;
    const unsub = onSnapshot(doc(db, "trips", trip.id, "collab", "discussion"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) {
        setMessages(docSnap.data().messages);
      }
    });
    return () => unsub();
  }, [trip?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !trip?.id) return;

    const participantColors = ["from-indigo-400 to-violet-500", "from-teal-400 to-cyan-500", "from-rose-400 to-pink-500", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500"];
    const userSeed = currentUser?.uid || dbUser?.email || "fallback";
    const myColor = participantColors[userSeed.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % participantColors.length];

    const newMessage = {
      id: Date.now(),
      senderId: currentUser?.uid,
      senderName: fullName,
      senderInitials: initials,
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: myColor
    };

    const updated = [...messages, newMessage];
    await setDoc(doc(db, "trips", trip.id, "collab", "discussion"), { messages: updated }, { merge: true });
    setMessageInput("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto h-[600px] md:h-[800px] flex flex-col shadow-xl shadow-indigo-900/5 dark:shadow-black/20 rounded-[2.5rem] mb-12 bg-card border border-border/60 overflow-hidden">
      <div className="bg-muted/30 p-5 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <MessageCircle className="text-white" size={16} />
          </div>
          Team Discussion
        </h2>
        <div className="flex -space-x-2">
          {liveUsers.slice(0, 3).map((u, i) => (
            <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${u.color} border-2 border-card flex items-center justify-center text-white text-[10px] font-bold shadow-sm`} title={u.name} >
              {u.initials}
            </div>
          ))}
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-muted-foreground text-[10px] font-bold">
            +{(trip.participantIds?.length || 0) + 1}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 px-5 py-6 overflow-y-auto space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
            <MessageSquare size={48} className="mb-4" />
            <p className="font-bold">No messages yet</p>
            <p className="text-sm">Kick off the discussion by sharing an idea!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div key={msg.id || i} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${msg.color || "from-teal-500 to-cyan-600"} shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                  {msg.senderInitials}
                </div>
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="font-bold text-xs text-foreground/80">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className={`text-sm p-3.5 rounded-2xl border transition-all ${isMe
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10 rounded-tr-none"
                      : "bg-muted/40 text-foreground border-border/60 rounded-tl-none"
                    }`}>
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="p-6 border-t border-border bg-card">
        <div className="flex items-center gap-3 bg-muted/30 border border-border/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-[1.5rem] px-5 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all duration-300">
          <button type="button" className="text-muted-foreground hover:text-indigo-600 transition-colors shrink-0 p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-xl">
            <ImageIcon size={20} />
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message or share an idea..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/40 py-3.5"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-3 bg-indigo-600 text-white rounded-[1.15rem] hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-indigo-600/20 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ── NEW COLLABORATIVE MODULES ─────────────────────────────────────────────

function TripSuggestions({ trip }: { trip: any }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [polls, setPolls] = useState<any>({
    adventure: 0,
    food: 0,
    relaxation: 0,
    culture: 0,
    nightlife: 0,
  });
  const [newSuggestion, setNewSuggestion] = useState("");
  const { dbUser } = useAuth();
  const userName = dbUser?.displayName?.split(" ")[0] || "Explorer";

  useEffect(() => {
    if (!trip?.id) return;
    const unsubSug = onSnapshot(doc(db, "trips", trip.id, "collab", "suggestions"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().items) {
        setSuggestions(docSnap.data().items);
      }
    });
    const unsubPolls = onSnapshot(doc(db, "trips", trip.id, "collab", "polls"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().votes) {
        setPolls(docSnap.data().votes);
      }
    });
    return () => {
      unsubSug();
      unsubPolls();
    };
  }, [trip?.id]);

  const logActivity = async (action: string, target: string) => {
    const snap = await getDoc(doc(db, "trips", trip.id, "collab", "activity"));
    const items = snap.exists() ? snap.data().items || [] : [];
    const userInitials = userName.slice(0, 2).toUpperCase();
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      initials: userInitials,
      name: userName,
      color: "from-amber-500 to-orange-600",
      action,
      target,
      time: "Just now",
      isAI: false
    };
    setDoc(doc(db, "trips", trip.id, "collab", "activity"), { items: [newItem, ...items].slice(0, 20) }, { merge: true });
  };

  const addSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion.trim()) return;

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newSuggestion.trim(),
      suggestedBy: userName,
      upvotes: 0,
      downvotes: 0,
      status: "pending"
    };

    setDoc(doc(db, "trips", trip.id, "collab", "suggestions"), {
      items: suggestions.length ? [...suggestions, newItem] : [newItem]
    }, { merge: true }).then(() => {
      logActivity("suggested", newItem.text);
      setNewSuggestion("");
    });
  };

  const vote = (id: string, type: 'up' | 'down') => {
    const updated = suggestions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          upvotes: type === 'up' ? s.upvotes + 1 : s.upvotes,
          downvotes: type === 'down' ? s.downvotes + 1 : s.downvotes,
          status: (type === 'up' && s.upvotes + 1 >= 2) ? 'accepted' : ((type === 'down' && s.downvotes + 1 >= 2) ? 'rejected' : s.status)
        };
      }
      return s;
    });
    setDoc(doc(db, "trips", trip.id, "collab", "suggestions"), { items: updated }, { merge: true });
  };

  const pending = suggestions.filter(s => s.status === "pending");
  const accepted = suggestions.filter(s => s.status === "accepted");
  const rejected = suggestions.filter(s => s.status === "rejected");

  const votePoll = (category: string) => {
    const updated = { ...polls, [category]: (polls[category] || 0) + 1 };
    setDoc(doc(db, "trips", trip.id, "collab", "polls"), { votes: updated }, { merge: true });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto min-h-[60vh]">

      {/* Group Polls Section */}
      <div className="mb-12 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6">
        <h3 className="font-bold text-lg text-foreground mb-4">What vibe are we going for?</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(polls).map(([category, count]) => (
            <button
              key={category}
              onClick={() => votePoll(category)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
            >
              <span className="font-semibold capitalize text-foreground">{category}</span>
              <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900 dark:group-hover:text-indigo-200 transition-colors">
                {count as number}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Lightbulb className="text-amber-500" /> Group Suggestions
          </h2>
          <p className="text-muted-foreground mt-1">Vote on places and activities to add to the itinerary. 2 positive votes automatically accepts!</p>
        </div>
        <form onSubmit={addSuggestion} className="flex gap-2">
          <input
            type="text"
            placeholder="Suggest a place..."
            value={newSuggestion}
            onChange={e => setNewSuggestion(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-transparent border-indigo-200 outline-none focus:border-indigo-400"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors">
            + Suggest
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending */}
        <div className="bg-muted/30 p-4 rounded-3xl border border-border">
          <h3 className="font-bold mb-4 px-2 text-sm text-muted-foreground uppercase tracking-widest">Pending Voting ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map(s => (
              <div key={s.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                <h4 className="font-bold text-foreground">{s.text}</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Suggested by {s.suggestedBy}</p>
                <div className="flex gap-2">
                  <button onClick={() => vote(s.id, 'up')} className="flex-1 bg-emerald-50 text-emerald-600 font-bold py-1.5 rounded-lg text-sm hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20">👍 {s.upvotes}</button>
                  <button onClick={() => vote(s.id, 'down')} className="flex-1 bg-rose-50 text-rose-600 font-bold py-1.5 rounded-lg text-sm hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20">👎 {s.downvotes}</button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <div className="h-24 border-2 border-dashed border-border rounded-2xl flex items-center justify-center opacity-50 text-xs font-bold text-muted-foreground">No pending items</div>}
          </div>
        </div>

        {/* Accepted */}
        <div className="bg-muted/30 p-4 rounded-3xl border border-border">
          <h3 className="font-bold mb-4 px-2 text-sm text-emerald-600 uppercase tracking-widest">Accepted ({accepted.length})</h3>
          <div className="space-y-3">
            {accepted.map(s => (
              <div key={s.id} className="bg-card p-4 rounded-2xl shadow-sm border border-emerald-500/20 opacity-80">
                <h4 className="font-bold text-foreground">{s.text}</h4>
                <p className="text-xs text-emerald-600 mt-1 font-bold flex items-center gap-1">✅ Approved</p>
              </div>
            ))}
            {accepted.length === 0 && <div className="h-24 border-2 border-dashed border-border rounded-2xl flex items-center justify-center opacity-50 text-xs font-bold text-muted-foreground">No accepted items</div>}
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-muted/30 p-4 rounded-3xl border border-border">
          <h3 className="font-bold mb-4 px-2 text-sm text-rose-500 uppercase tracking-widest">Rejected ({rejected.length})</h3>
          <div className="space-y-3">
            {rejected.map(s => (
              <div key={s.id} className="bg-card p-4 rounded-2xl shadow-sm border border-rose-500/20 opacity-50">
                <h4 className="font-bold text-foreground line-through">{s.text}</h4>
                <p className="text-xs text-rose-600 mt-1 font-bold flex items-center gap-1">❌ Rejected</p>
              </div>
            ))}
            {rejected.length === 0 && <div className="h-24 border-2 border-dashed border-border rounded-2xl flex items-center justify-center opacity-50 text-xs font-bold text-muted-foreground">No rejected items</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TripNotes({ trip }: { trip: any }) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Up to date");
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const { dbUser } = useAuth();
  const userName = dbUser?.displayName?.split(" ")[0] || "Explorer";

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseUpdate = useRef(0);
  const [cursors, setCursors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!trip?.id) return;
    const unsub = onSnapshot(doc(db, "trips", trip.id, "collab", "notes"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().content !== undefined) {
        setContent(docSnap.data().content);
      }
    });

    const unsubCursors = onSnapshot(doc(db, "trips", trip.id, "collab", "cursors"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const otherCursors = { ...data };
        delete otherCursors[userName];

        // Clear stale cursors older than 10 seconds
        const now = Date.now();
        Object.keys(otherCursors).forEach(k => {
          if (now - otherCursors[k].updatedAt > 10000) {
            delete otherCursors[k];
          }
        });
        setCursors(otherCursors);
      }
    });

    return () => {
      unsub();
      unsubCursors();
    };
  }, [trip?.id, userName]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseUpdate.current > 300) { // Throttle ~3 FPS
      lastMouseUpdate.current = now;
      if (containerRef.current && trip?.id) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const colors = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#14b8a6"];
        const colorHash = userName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        const color = colors[colorHash];

        setDoc(doc(db, "trips", trip.id, "collab", "cursors"), {
          [userName]: { x, y, name: userName, color, updatedAt: now }
        }, { merge: true });
      }
    }
  };

  const handleMouseLeave = () => {
    if (trip?.id) {
      setDoc(doc(db, "trips", trip.id, "collab", "cursors"), {
        [userName]: { x: -100, y: -100, name: userName, color: "transparent", updatedAt: 0 }
      }, { merge: true });
    }
  };

  const logActivity = async (action: string, target: string) => {
    const snap = await getDoc(doc(db, "trips", trip.id, "collab", "activity"));
    const items = snap.exists() ? snap.data().items || [] : [];
    const userInitials = userName.slice(0, 2).toUpperCase();
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      initials: userInitials,
      name: userName,
      color: "from-blue-500 to-indigo-600",
      action,
      target,
      time: "Just now",
      isAI: false
    };
    setDoc(doc(db, "trips", trip.id, "collab", "activity"), { items: [newItem, ...items].slice(0, 20) }, { merge: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setStatus("Saving...");

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setDoc(doc(db, "trips", trip.id, "collab", "notes"),
        { content: val, updatedAt: new Date().toISOString() },
        { merge: true }
      ).then(() => {
        setStatus("Saved");
        logActivity("updated", "shared notes");
      });
    }, 1000);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto min-h-[60vh]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 mb-2">
            <FileText className="text-blue-500" /> Shared Notes
          </h2>
          <p className="text-muted-foreground">Collaborative scratchpad for packing lists, flight details, and reminders.</p>
        </div>
        <button className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-bold text-sm rounded-lg hover:bg-blue-200 transition-colors">
          Share Notes
        </button>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 p-6 rounded-3xl min-h-[400px] shadow-sm relative overflow-hidden"
      >
        {Object.values(cursors).map((c: any) => (
          c.x >= 0 && c.y >= 0 && (
            <div
              key={c.name}
              className="absolute pointer-events-none transition-all duration-300 ease-out z-50 flex flex-col items-start"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={c.color} xmlns="http://www.w3.org/2000/svg" className="transform -translate-x-1 -translate-y-1 drop-shadow-md">
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.61c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.85.35z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <div className="bg-white px-2 py-0.5 rounded shadow-sm text-[10px] font-bold mt-1 tracking-wide uppercase border transform -translate-x-1" style={{ borderColor: c.color, color: c.color }}>
                {c.name}
              </div>
            </div>
          )
        ))}

        <div className="absolute top-4 right-4 text-xs font-bold text-yellow-600/60 dark:text-yellow-500/40 z-10">{status}</div>
        <textarea
          value={content}
          onChange={handleChange}
          className="w-full h-full min-h-[350px] bg-transparent resize-none outline-none font-medium text-foreground placeholder:text-muted-foreground/50"
          placeholder="Start typing your group notes here... Anyone in the trip can edit this."
        />
      </div>
    </div>
  );
}

function TripTasks({ trip }: { trip: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const { dbUser } = useAuth();
  const userName = dbUser?.displayName?.split(" ")[0] || "Explorer";

  useEffect(() => {
    if (!trip?.id) return;
    const unsub = onSnapshot(doc(db, "trips", trip.id, "collab", "tasks"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().items) {
        setTasks(docSnap.data().items);
      }
    });
    return () => unsub();
  }, [trip?.id]);

  const logActivity = async (action: string, target: string) => {
    const snap = await getDoc(doc(db, "trips", trip.id, "collab", "activity"));
    const items = snap.exists() ? snap.data().items || [] : [];
    const userInitials = userName.slice(0, 2).toUpperCase();
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      initials: userInitials,
      name: userName,
      color: "from-teal-500 to-emerald-600",
      action,
      target,
      time: "Just now",
      isAI: false
    };
    setDoc(doc(db, "trips", trip.id, "collab", "activity"), { items: [newItem, ...items].slice(0, 20) }, { merge: true });
  };

  const toggleTask = (index: number) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setDoc(doc(db, "trips", trip.id, "collab", "tasks"), { items: updated }, { merge: true }).then(() => {
      logActivity(updated[index].done ? "completed task" : "uncompleted task", updated[index].text);
    });
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask = { text: newTaskInput.trim(), assigned: userName, done: false };

    setDoc(doc(db, "trips", trip.id, "collab", "tasks"), {
      items: tasks.length ? [...tasks, newTask] : [newTask]
    }, { merge: true }).then(() => {
      logActivity("added task", newTask.text);
      setNewTaskInput("");
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto min-h-[60vh]">
      <h2 className="text-2xl font-bold font-heading flex items-center gap-2 mb-2">
        <CheckSquare className="text-teal-500" /> Trip Checklist
      </h2>
      <p className="text-muted-foreground mb-8">Assign group tasks and share responsibilities.</p>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${task.done ? "bg-muted/10 opacity-60 border-transparent" : "bg-card shadow-sm border-border"}`}>
            <div className="flex items-center gap-4">
              <input type="checkbox" checked={task.done} onChange={() => toggleTask(i)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-600 accent-indigo-600" />
              <span className={`font-semibold ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.text}</span>
            </div>
            <div className="text-xs font-bold bg-muted px-3 py-1 rounded-full text-muted-foreground">
              {task.assigned}
            </div>
          </div>
        ))}

        <form onSubmit={addTask} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="+ Add a new task..."
            className="flex-1 p-4 text-sm font-semibold bg-transparent border-2 border-dashed border-border rounded-2xl outline-none focus:border-indigo-400 placeholder:text-muted-foreground"
          />
          {newTaskInput && (
            <button type="submit" className="px-6 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700">Add</button>
          )}
        </form>
      </div>
    </div>
  );
}

function TripActivityFeed({ trip }: { trip: any }) {
  const [feed, setFeed] = useState<any[]>([
    { id: 1, initials: "AI", name: "Voyager AI", color: "from-purple-500 to-purple-700", action: "initialized", target: "trip workspace", time: "Just now", isAI: true }
  ]);

  useEffect(() => {
    if (!trip?.id) return;
    const unsub = onSnapshot(doc(db, "trips", trip.id, "collab", "activity"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().items) {
        setFeed(docSnap.data().items);
      }
    });
    return () => unsub();
  }, [trip?.id]);

  return (
    <div className="bg-card rounded-[2rem] p-6 md:p-8 shadow-xl shadow-indigo-900/5 dark:shadow-black/40 border border-border/60 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Activity className="text-purple-600 dark:text-purple-400" size={16} />
          </div>
          Activity Feed
        </h2>
        <span className="bg-indigo-100/50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> Live
        </span>
      </div>

      <div className="space-y-6 relative flex-1 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-border via-border/60 to-transparent dark:from-border/40 pointer-events-none z-0" />

        {feed.map((item, i) => (
          <div key={item.id || i} className="flex gap-4 relative group">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-black/5 z-10 group-hover:scale-110 transition-transform duration-300 ring-4 ring-card`}>
              {item.isAI ? <Sparkles size={16} /> : item.initials}
            </div>
            <div className={`flex-1 p-4 rounded-2xl text-sm border transition-all ${item.isAI ? "bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/20 shadow-sm" : "bg-muted/20 border-border/40 hover:bg-muted/50 hover:border-border"}`}>
              <p className="text-foreground leading-relaxed">
                <span className={`font-bold ${item.isAI ? "text-indigo-700 dark:text-indigo-400" : ""}`}>{item.name}</span>
                <span className="text-muted-foreground mr-1"> {item.action}</span>
                <br />
                <span className="font-semibold text-foreground bg-foreground/5 dark:bg-foreground/10 px-2 py-0.5 rounded-md inline-block mt-1">{item.target}</span>
              </p>
              <span className="text-[11px] text-muted-foreground mt-2 block font-medium flex items-center gap-1.5 uppercase tracking-wider">
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3.5 rounded-xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2">
        Load More Activity
      </button>
    </div>
  );
}
