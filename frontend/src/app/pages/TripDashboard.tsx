import { Calendar, Users, MapPin, Plus, Wallet, ArrowRight, Compass, Sparkles, TrendingUp, Clock, X, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { useTrips } from "../contexts/TripContext";

export default function TripDashboard() {
  const { dbUser } = useAuth();
  const firstName = dbUser?.displayName?.split(" ")[0] || "Explorer";
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);
  
  const { trips, addTrip } = useTrips();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTripCity, setNewTripCity] = useState("");
  const [newTripStartDate, setNewTripStartDate] = useState("");
  const [newTripEndDate, setNewTripEndDate] = useState("");
  const [newTripTravelers, setNewTripTravelers] = useState<number>(2);
  const [newTripBudget, setNewTripBudget] = useState<number>(2500);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  const totalPartners = Array.from(new Set(trips.flatMap(t => t.participantIds || []))).length;
  const activeTripsCount = trips.length;
  const totalBudget = trips.reduce((acc, t) => acc + t.budget.total, 0);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripCity || !newTripStartDate || !newTripEndDate) return;
    setIsCreatingTrip(true);
    
    // Auto-generate photo URL for thumbnail using Pollinations AI (free, no key needed)
    const encodedCity = encodeURIComponent(newTripCity);
    const photoUrl = `https://image.pollinations.ai/prompt/${encodedCity}%20landscape%20tourism%20photography%20high%20quality?width=1080&height=720&nologo=true`;
    
    // Formatting date
    const start = new Date(newTripStartDate);
    const end = new Date(newTripEndDate);
    const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const dateStr = `${start.toLocaleDateString('en-US', dateOpts)} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}`;
    
    const timeDiff = start.getTime() - new Date().getTime();
    const daysLeft = timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 3600 * 24)) : 0;
    
    addTrip({
      name: `${newTripCity.split(",")[0]} Adventure`,
      image: photoUrl,
      dates: dateStr,
      rawStartDate: newTripStartDate,
      rawEndDate: newTripEndDate,
      daysLeft,
      travelers: newTripTravelers,
      budget: { spent: 0, total: newTripBudget },
      location: newTripCity,
      status: "planning",
      statusBg: "bg-amber-500",
      statusText: "Planning",
      accentGradient: "from-pink-500 to-rose-500",
      barColor: "from-amber-400 to-orange-400",
      savedPlaces: []
    });

    setTimeout(() => {
      setIsCreatingTrip(false);
      setIsModalOpen(false);
      setNewTripCity("");
      setNewTripStartDate("");
      setNewTripEndDate("");
      setNewTripTravelers(2);
      setNewTripBudget(2500);
    }, 1500);  
  };
  
  const quickStats = [
    { icon: MapPin, label: "Active Trips", value: activeTripsCount.toString(), iconBg: "bg-white/20" },
    { icon: Users, label: "Travel Partners", value: totalPartners.toString(), iconBg: "bg-white/20" },
    { icon: TrendingUp, label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(1)}k`, iconBg: "bg-white/20" },
    { icon: Clock, label: "Next Trip", value: trips.length > 0 ? `${Math.min(...trips.map(t => t.daysLeft))}d` : "N/A", iconBg: "bg-white/20" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-full bg-[#F5F4F8] dark:bg-[#0D0D1A]">

      {/* ===== HERO HEADER ===== */}
      <div className="relative pt-12 pb-28 px-8 border-b border-border/40">
        {/* Background gradient/image blend */}
        <div className="absolute inset-0 bg-background dark:bg-[#0D0D1A]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-5 dark:opacity-[0.03] mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/20" />

        <div className="relative max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Compass size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-[0.15em]">My Workspace</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-heading text-foreground leading-tight tracking-tight">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{firstName}! 👋</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-base font-medium">
                You have {trips.length} trips in progress — let's make them perfect.
              </p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="self-start md:self-auto flex items-center gap-2.5 bg-foreground text-background dark:bg-white dark:text-black px-6 py-3.5 rounded-[1.25rem] font-bold text-sm hover:scale-105 transition-transform shadow-xl shadow-black/5"
            >
              <Plus size={16} />
              Plan New Trip
            </button>
          </div>

          {/* Stats Row — Clean bordered cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 bg-card/60 backdrop-blur-xl border border-border/60 shadow-lg shadow-indigo-900/5 dark:shadow-black/20"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20">
                  <stat.icon size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-3xl font-bold font-heading text-foreground leading-none mb-1.5">{stat.value}</p>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TRIP CARDS ===== */}
      <div className="max-w-7xl mx-auto px-8 -mt-20 pb-16 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Your Trips</h2>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {trips.length}
            </span>
          </div>
          <button className="text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors">
            Sort by date ↓
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {trips.map(trip => {
            const pct = Math.round((trip.budget.spent / trip.budget.total) * 100);
            const isOver80 = pct > 80;

            return (
              <div
                key={trip.id}
                onMouseEnter={() => setHoveredTrip(trip.id)}
                onMouseLeave={() => setHoveredTrip(null)}
                className="group bg-white dark:bg-[#13132B] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-2xl hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/20 transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden shrink-0">
                  <img
                    src={trip.image}
                    alt={trip.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Status pill */}
                  <div className={`absolute top-3.5 left-3.5 ${trip.statusBg} text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg`}>
                    {trip.statusText}
                  </div>

                  {/* Days away */}
                  <div className="absolute top-3.5 right-3.5 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-white/10">
                    <Clock size={11} /> {trip.daysLeft}d away
                  </div>

                  {/* Trip name overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold font-heading text-lg leading-tight drop-shadow-lg">{trip.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-white/70" />
                      <p className="text-white/70 text-xs font-medium">{trip.location}</p>
                    </div>
                  </div>

                  {/* AI sparkle badge */}
                  <div className={`absolute bottom-4 right-4 w-9 h-9 bg-gradient-to-br ${trip.accentGradient} rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 ${hoveredTrip === trip.id ? "scale-110 rotate-6" : ""}`}>
                    <Sparkles size={15} className="text-white" />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Meta pills */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <Calendar size={13} className="text-indigo-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{trip.dates}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2">
                       <Users size={13} className="text-teal-500 shrink-0" />
                       <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{(trip.participantIds?.length || 0) + 1} travelers</span>
                    </div>
                  </div>

                  {/* Budget bar */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={12} className={isOver80 ? "text-red-500" : "text-teal-500"} />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">${trip.budget.spent.toLocaleString()}</span>
                        <span className="text-xs text-gray-400"> / ${trip.budget.total.toLocaleString()}</span>
                      </div>
                      <span className={`text-xs font-bold ${isOver80 ? "text-red-500" : "text-teal-600 dark:text-teal-400"}`}>{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${isOver80 ? "from-red-400 to-red-500" : trip.barColor} transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Open Trip CTA */}
                  <Link
                    to={`/dashboard/trips/${trip.id}`}
                    className="mt-auto flex items-center justify-between w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-950/50 dark:hover:bg-indigo-600 text-indigo-700 hover:text-white dark:text-indigo-300 dark:hover:text-white font-bold text-sm rounded-2xl transition-all duration-300 group/btn border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200/50"
                  >
                    <span>Open Trip</span>
                    <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add New Trip placeholder */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="bg-white dark:bg-[#13132B] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700 flex flex-col items-center justify-center min-h-[420px] cursor-pointer group transition-all hover:shadow-xl hover:-translate-y-2 duration-500"
          >
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-all duration-300">
              <Plus size={28} className="text-indigo-400 group-hover:text-indigo-600" />
            </div>
            <p className="font-bold text-gray-800 dark:text-white text-base font-heading">Plan new adventure</p>
            <p className="text-gray-400 text-sm mt-1 text-center max-w-[160px]">Start your next dream trip</p>
          </div>
        </div>
      </div>

      {/* ===== PLAN NEW TRIP MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isCreatingTrip && setIsModalOpen(false)} />
          
          <div className="relative bg-white dark:bg-card w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all">
            <button 
              onClick={() => !isCreatingTrip && setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold font-heading mb-6 dark:text-white">Plan New Trip</h3>
            
            <form onSubmit={handleCreateTrip} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">City / Destination</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={newTripCity}
                    onChange={(e) => setNewTripCity(e.target.value)}
                    placeholder="e.g. Kyoto, Japan"
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newTripStartDate}
                    onChange={(e) => setNewTripStartDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    min={newTripStartDate}
                    value={newTripEndDate}
                    onChange={(e) => setNewTripEndDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Travelers</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newTripTravelers}
                    onChange={(e) => setNewTripTravelers(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Budget Total ($)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={newTripBudget}
                    onChange={(e) => setNewTripBudget(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <button  
                type="submit" 
                disabled={isCreatingTrip}
                className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCreatingTrip ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Start Planning
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
