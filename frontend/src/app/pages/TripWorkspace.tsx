import { useState } from "react";
import { useParams } from "react-router";
import { Calendar, MapPin, Wallet, Pencil, ChevronRight, MessageSquare, Image as ImageIcon, Map, MessageCircle, Users, Sparkles, Activity, BarChart2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ItineraryPlanner from "../components/ItineraryPlanner";
import BudgetTracker from "./BudgetTracker";
import DestinationDiscovery from "./DestinationDiscovery";
import { Map as MapComponent } from "@/components/ui/map";

export default function TripWorkspace() {
  useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "itinerary", label: "Itinerary", icon: Calendar },
    { id: "destinations", label: "Destinations", icon: MapPin },
    { id: "budget", label: "Budget", icon: BarChart2 },
    { id: "discussion", label: "Discussion", icon: MessageCircle },
  ];

  return (
    <div className="min-h-full bg-background pb-12">
      {/* ===== TRIP HERO HEADER ===== */}
      <div className="relative">
        {/* Background Image strip */}
        <div className="h-48 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=2000"
            alt="Bali"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
          
          {/* Breadcrumb */}
          <div className="absolute top-6 left-8 flex items-center gap-2 text-white/70 text-xs font-semibold">
            <span className="hover:text-white cursor-pointer transition-colors">My Trips</span>
            <ChevronRight size={14} />
            <span className="text-white">Bali Retreat 2026</span>
          </div>

          {/* Edit button */}
          <button className="absolute top-5 right-8 flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all">
            <Pencil size={13} /> Edit Trip
          </button>
        </div>

        {/* Content overlay */}
        <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-8">
            {/* Trip info row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 -mt-8 relative">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold font-heading text-foreground">Bali Retreat 2026</h1>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                    ✓ Confirmed
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
                    <Calendar size={13} className="text-indigo-500" />
                    <span className="font-medium">Oct 12 – 20, 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
                    <MapPin size={13} className="text-rose-500" />
                    <span className="font-medium">Bali, Indonesia</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
                    <Wallet size={13} className="text-teal-500" />
                    <span className="font-semibold text-foreground">$4,500</span>
                    <span className="text-muted-foreground">/ $6,000</span>
                  </div>
                </div>
              </div>

              {/* Collaborators */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex -space-x-2">
                  {[
                    { initials: "AW", color: "from-indigo-400 to-violet-500" },
                    { initials: "SJ", color: "from-teal-400 to-cyan-500" },
                    { initials: "MK", color: "from-rose-400 to-pink-500" },
                  ].map((user, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.color} border-2 border-card flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:scale-110 transition-transform z-${30 - i * 10}`}
                      title={user.initials}
                    >
                      {user.initials}
                    </div>
                  ))}
                  <button className="w-9 h-9 rounded-full bg-muted border-2 border-card text-muted-foreground text-xs font-bold hover:bg-accent transition-colors flex items-center justify-center">
                    +
                  </button>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  <Users size={12} className="inline mr-1" />4 travelers
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 pt-2 px-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 rounded-t-lg ${
                    activeTab === tab.id
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
      <div className="bg-background mt-6">
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
  const initials = dbUser?.displayName ? dbUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "E";
  const firstName = dbUser?.displayName?.split(" ")[0] || "Explorer";

  const activities = [
    { icon: "✈️", date: "Oct", day: "12", title: "Flight to Denpasar", sub: "Garuda Indonesia GA-802 · 14:30 PM", active: true },
    { icon: "🏨", date: "Oct", day: "12", title: "Check-in at Alila Villas", sub: "Uluwatu, Bali · 18:00 PM", active: false },
    { icon: "🌊", date: "Oct", day: "13", title: "Uluwatu Temple & Kecak Dance", sub: "09:00 AM · 3 hours", active: false },
  ];

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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mapProvider === p
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
              center={[115.1889, -8.4095]}
              zoom={10}
              className="w-full h-full object-cover"
              styles={mapProvider === "osm" ? { light: OSM_STYLE, dark: OSM_STYLE } : undefined}
            />
            
            {/* Floating Map Label */}
            <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-[#13132B]/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 flex items-center gap-3 pointer-events-none ring-1 ring-black/5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <p className="font-bold text-sm text-foreground leading-none">Bali, Indonesia</p>
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
            {activities.map((act, i) => (
              <div key={i} className={`flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                act.active
                  ? "border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-white dark:from-[#1E1E3F] dark:to-[#13132B] shadow-sm transform scale-[1.02]"
                  : "border-border/60 bg-muted/20 hover:bg-muted/40"
              }`}>
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm ${
                    act.active
                      ? "bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-indigo-600/30"
                      : "bg-white dark:bg-card border border-border/60 text-muted-foreground"
                  }`}>
                    <span className="text-[10px] font-bold uppercase leading-none mt-1">{act.date}</span>
                    <span className="text-lg font-bold leading-none mb-1">{act.day}</span>
                  </div>
                  <span className="text-3xl filter drop-shadow-sm">{act.icon}</span>
                </div>
                <div>
                  <h4 className={`font-bold text-base leading-tight mb-1.5 ${act.active ? "text-indigo-900 dark:text-indigo-100" : "text-foreground"}`}>{act.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{act.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Activity Feed */}
      <div className="xl:col-span-4 flex flex-col">
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

          <div className="space-y-6 relative flex-1">
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-border via-border/60 to-transparent dark:from-border/40 pointer-events-none" />

            {[
              { initials, name: firstName, color: "from-indigo-500 to-indigo-700", action: "added", target: "Potato Head Beach Club", time: "2h ago", isAI: false },
              { initials: "SJ", name: "Sarah J.", color: "from-teal-500 to-teal-700", action: "updated", target: "Day 2 itinerary", time: "5h ago", isAI: false },
              { initials: null, name: "Voyager AI", color: "from-purple-500 to-purple-700", action: "generated", target: "draft itinerary", time: "1d ago", isAI: true },
              { initials: "MK", name: "Mike K.", color: "from-rose-500 to-rose-700", action: "voted on", target: "Surfing lessons", time: "1d ago", isAI: false },
              { initials, name: firstName, color: "from-indigo-500 to-indigo-700", action: "invited", target: "3 friends", time: "2d ago", isAI: false },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 relative group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-black/5 z-10 group-hover:scale-110 transition-transform duration-300 ring-4 ring-card`}>
                  {item.isAI ? <Sparkles size={16} /> : item.initials}
                </div>
                <div className={`flex-1 p-4 rounded-2xl text-sm border transition-all ${item.isAI ? "bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/20 shadow-sm" : "bg-muted/20 border-border/40 hover:bg-muted/50 hover:border-border"}`}>
                  <p className="text-foreground leading-relaxed">
                    <span className={`font-bold ${item.isAI ? "text-indigo-700 dark:text-indigo-400" : ""}`}>{item.name}</span>
                    <span className="text-muted-foreground mr-1"> {item.action}</span>
                    <br/>
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
      </div>
    </div>
  );
}

function TripDiscussion() {
  const { dbUser } = useAuth();
  const initials = dbUser?.displayName ? dbUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "E";
  const fullName = dbUser?.displayName || "Explorer";

  return (
    <div className="p-6 max-w-3xl mx-auto h-[600px] md:h-[800px] flex flex-col shadow-lg shadow-indigo-900/5 dark:shadow-black/20 rounded-[2.5rem] mb-12">
      <div className="bg-card rounded-t-[2.5rem] p-5 border border-border border-b-0 flex items-center justify-between shrink-0">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg flex items-center justify-center">
            <MessageCircle className="text-indigo-600" size={15} />
          </div>
          Team Chat
        </h2>
        <div className="flex -space-x-2">
          {["from-indigo-400 to-violet-500", "from-teal-400 to-cyan-500", "from-rose-400 to-pink-500"].map((c, i) => (
            <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} border-2 border-card`} />
          ))}
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-muted-foreground text-xs font-bold">+1</div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border border-t-0 border-b-0 px-5 py-4 overflow-y-auto space-y-5">
        {/* Message 1 */}
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shrink-0 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-sm text-foreground">{fullName}</span>
              <span className="text-xs text-muted-foreground">10:42 AM</span>
            </div>
            <p className="text-sm text-foreground bg-muted/40 inline-block p-3.5 rounded-2xl rounded-tl-md border border-border">
              Hey everyone! I've added seafood restaurant options for our first night in Seminyak. Anyone have preferences? 🦐
            </p>
          </div>
        </div>

        {/* Message 2 */}
        <div className="flex gap-3 flex-row-reverse">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shrink-0 flex items-center justify-center text-white text-xs font-bold">SJ</div>
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-muted-foreground">11:05 AM</span>
              <span className="font-bold text-sm text-foreground">Sarah Jenkins</span>
            </div>
            <p className="text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 inline-block p-3.5 rounded-2xl rounded-tr-md shadow-md">
              Seafood sounds great! Jimbaran Bay is amazing for sunset dinners 🌅
            </p>
          </div>
        </div>

        {/* Message 3 */}
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shrink-0 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-sm text-foreground">{fullName}</span>
              <span className="text-xs text-muted-foreground">11:12 AM</span>
            </div>
            <p className="text-sm text-foreground bg-muted/40 inline-block p-3.5 rounded-2xl rounded-tl-md border border-border">
              Perfect, let me ask Voyager AI to schedule it for Day 2 sunset! ✨
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border border-border border-t-0 rounded-b-3xl p-4 shrink-0">
        <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-2xl px-4 py-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ImageIcon size={18} />
          </button>
          <input
            type="text"
            placeholder="Share an idea with your group..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground py-2.5"
          />
          <button className="p-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm shrink-0">
            <MessageSquare size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
