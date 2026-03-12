import { useState } from "react";
import { useParams } from "react-router";
import { Calendar, MapPin, Wallet, Pencil, ChevronRight, MessageSquare, Image as ImageIcon, Map, MessageCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ItineraryPlanner from "../components/ItineraryPlanner";
import BudgetTracker from "./BudgetTracker";
import DestinationDiscovery from "./DestinationDiscovery";
import { Map as MapComponent } from "@/components/ui/map";

export default function TripWorkspace() {
  useParams(); // Kept for future logic if tripId is needed
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "itinerary", label: "Itinerary" },
    { id: "destinations", label: "Destinations" },
    { id: "budget", label: "Budget" },
    { id: "discussion", label: "Discussion" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Section */}
      <div className="bg-card border-b border-border shrink-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
              <span className="hover:text-gray-900 cursor-pointer transition-colors">My Trips</span>
              <ChevronRight size={16} />
              <span className="text-blue-600">Bali Retreat 2026</span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold font-heading text-foreground">Bali Retreat 2026</h1>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold uppercase tracking-wider">Confirmed</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Calendar size={16} className="text-blue-600" />
                Oct 12 - Oct 20, 2026
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <MapPin size={16} className="text-blue-600" />
                Bali, Indonesia
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Wallet size={16} className="text-[#2A9D8F]" />
                <span className="font-semibold text-gray-900">$4,500</span> / $6,000
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-background flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shadow-sm">
                  U{i}
                </div>
              ))}
              <button className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground font-medium text-sm hover:bg-accent transition-colors">
                +2
              </button>
            </div>
            <div className="w-px h-8 bg-border mx-2"></div>
            <button className="bg-card border border-border text-foreground px-4 py-2.5 rounded-full font-medium hover:bg-accent transition-all shadow-sm flex items-center gap-2">
              <Pencil size={18} className="text-muted-foreground" /> Edit Trip
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center gap-8 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 pt-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 px-1 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-background">
        {activeTab === "overview" && <TripOverview />}
        {activeTab === "itinerary" && <ItineraryPlanner />}
        {activeTab === "destinations" && <DestinationDiscovery context="trip" />}
        {activeTab === "budget" && <BudgetTracker />}
        {activeTab === "discussion" && <TripDiscussion />}
      </div>
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

function TripOverview() {
  const [mapProvider, setMapProvider] = useState<"carto" | "osm">("carto");
  const { dbUser } = useAuth();
  const initials = dbUser?.displayName ? dbUser.displayName.charAt(0).toUpperCase() : "E";
  const firstName = dbUser?.displayName?.split(" ")[0] || "Explorer";

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-card rounded-[1.25rem] p-6 shadow-sm border border-border">
          <h2 className="font-heading font-bold text-xl mb-4 text-gray-900 flex items-center gap-2">
            <Map className="text-blue-600" size={24} /> Trip Map
          </h2>
          <div className="h-96 bg-card rounded-xl w-full relative overflow-hidden group">
            <MapComponent 
              center={[115.1889, -8.4095]}
              zoom={10}
              className="w-full h-full"
              styles={mapProvider === "osm" ? { light: OSM_STYLE, dark: OSM_STYLE } : undefined}
            />
            
            {/* Map Provider Toggle */}
            <div className="absolute top-4 left-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setMapProvider("carto")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border transition-all ${
                  mapProvider === "carto" 
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg" 
                    : "bg-background/80 text-foreground border-border hover:bg-background"
                }`}
              >
                Carto
              </button>
              <button 
                onClick={() => setMapProvider("osm")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border transition-all ${
                  mapProvider === "osm" 
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg" 
                    : "bg-background/80 text-foreground border-border hover:bg-background"
                }`}
              >
                OSM
              </button>
            </div>

            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-border flex items-center gap-2 pointer-events-none">
              <MapPin size={16} className="text-red-500" />
              <div>
                <p className="font-bold text-xs text-gray-900 leading-none">Bali, Indonesia</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Base Camp</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-[1.25rem] p-6 shadow-sm border border-border">
          <h2 className="font-heading font-bold text-xl mb-4 text-foreground flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} /> Up Next
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-semibold uppercase">Oct</span>
                <span className="text-lg font-bold leading-none">12</span>
              </div>
              <div>
                <h4 className="font-bold text-foreground">Flight to Denpasar</h4>
                <p className="text-sm text-muted-foreground mt-1">Garuda Indonesia GA-802 • 14:30 PM Departure</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl border border-border bg-muted/30">
              <div className="w-12 h-12 bg-card border border-border text-muted-foreground rounded-xl flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-semibold uppercase">Oct</span>
                <span className="text-lg font-bold leading-none">12</span>
              </div>
              <div>
                <h4 className="font-bold text-foreground">Check-in at Alila Villas</h4>
                <p className="text-sm text-muted-foreground mt-1">Uluwatu, Bali • 18:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-card rounded-[1.25rem] p-6 shadow-sm border border-border">
          <h2 className="font-heading font-bold text-lg mb-4 text-foreground">Activity Feed</h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-card bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <span className="text-sm font-bold">{initials}</span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-muted/30 border border-border text-foreground">
                <p className="text-sm"><span className="font-semibold">{firstName}</span> added a new destination <span className="font-semibold text-blue-600">Potato Head Beach Club</span></p>
                <span className="text-xs text-muted-foreground mt-1 block">2 hours ago</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-green-100 text-green-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <span className="text-sm font-bold">SJ</span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-sm text-gray-800"><span className="font-semibold">Sarah J.</span> updated Day 2 itinerary</p>
                <span className="text-xs text-gray-400 mt-1 block">5 hours ago</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-purple-100 text-purple-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <Sparkles size={16} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm text-gray-800"><span className="font-semibold text-blue-700">Voyager AI</span> generated a draft itinerary</p>
                <span className="text-xs text-blue-400 mt-1 block">1 day ago</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function TripDiscussion() {
  const { dbUser } = useAuth();
  const initials = dbUser?.displayName ? dbUser.displayName.charAt(0).toUpperCase() : "E";
  const fullName = dbUser?.displayName || "Explorer";

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="bg-white rounded-t-[1.25rem] p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h2 className="font-heading font-bold text-xl text-gray-900 flex items-center gap-2">
          <MessageCircle className="text-blue-600" size={24} /> Team Discussion
        </h2>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-white p-6 overflow-y-auto space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold">{initials}</div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-gray-900">{fullName}</span>
              <span className="text-xs text-gray-500">10:42 AM</span>
            </div>
            <p className="text-gray-700 bg-gray-50 inline-block p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
              Hey everyone! I've added a few restaurant options for our first night in Seminyak. What does everyone think about seafood? 🦐
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-bold">SJ</div>
          <div className="flex-1 flex flex-col items-end">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">11:05 AM</span>
              <span className="font-semibold text-gray-900">Sarah Jenkins</span>
            </div>
            <p className="text-white bg-blue-600 inline-block p-3 rounded-2xl rounded-tr-sm shadow-sm">
              Seafood sounds perfect! I saw Jimbaran Bay is famous for it. Can we fit that in?
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold">{initials}</div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-gray-900">{fullName}</span>
              <span className="text-xs text-gray-500">11:12 AM</span>
            </div>
            <p className="text-gray-700 bg-gray-50 inline-block p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
              Yes, let me ask Voyager to schedule it for Day 2 sunset.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-gray-100 rounded-b-[1.25rem] shrink-0">
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ImageIcon size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-gray-100 border-none rounded-full py-3 px-5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
          <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
            <MessageSquare size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
