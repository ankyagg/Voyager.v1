import { useState } from "react";
import { GripVertical, Clock, MapPin, Map as MapIcon, Calendar, Compass, ArrowRight, Sparkles, Loader2, X, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { generateAIItinerary, type ItineraryResponse, type DayPlan } from "@/lib/aiApi";

// ── Static saved places (unchanged) ──────────────────────────────────────────
const SAVED_PLACES = [
  { name: "Tanah Lot Temple",      type: "Sightseeing",   time: "2h" },
  { name: "Finns Beach Club",       type: "Entertainment", time: "4h" },
  { name: "Campuhan Ridge Walk",    type: "Activity",      time: "1.5h" },
  { name: "Nusa Penida Day Trip",   type: "Activity",      time: "Full Day" },
];

// ── Default mock itinerary (shown before AI generates) ────────────────────────
const DEFAULT_ITINERARY = [
  {
    day: 1,
    date: "Mon, Oct 12",
    stops: [
      { time: "09:00 AM", title: "Breakfast at Sisterfields",   type: "food",     duration: "1h"  },
      { time: "11:00 AM", title: "Seminyak Beach Surf",          type: "activity", duration: "3h"  },
      { time: "05:00 PM", title: "Sunset at Potato Head",        type: "drinks",   duration: "4h"  },
    ],
  },
  {
    day: 2,
    date: "Tue, Oct 13",
    stops: [
      { time: "08:30 AM", title: "Ubud Monkey Forest",           type: "activity",    duration: "2h"   },
      { time: "11:30 AM", title: "Tegalalang Rice Terrace",       type: "sightseeing", duration: "2h"   },
      { time: "02:00 PM", title: "Lunch at Locavore",             type: "food",        duration: "1.5h" },
      { time: "07:00 PM", title: "Dinner at Jimbaran Bay",        type: "food",        duration: "2h"   },
    ],
  },
];

// ── Converts AI DayPlan[] into the display format ─────────────────────────────
function aiDaysToStops(days: DayPlan[]): typeof DEFAULT_ITINERARY {
  return days.map((d) => ({
    day: d.day,
    date: `Day ${d.day}`,
    stops: d.activities.map((act, i) => ({
      time: `${(9 + i * 2).toString().padStart(2, "0")}:00 ${9 + i * 2 < 12 ? "AM" : "PM"}`,
      title: act,
      type: "activity" as const,
      duration: "2h",
    })),
  }));
}

// ── AI Generate Panel ─────────────────────────────────────────────────────────
interface AIPanelProps {
  onApply: (itinerary: ItineraryResponse) => void;
  onClose: () => void;
}

function AIGeneratePanel({ onApply, onClose }: AIPanelProps) {
  const [city, setCity]               = useState("Bali");
  const [days, setDays]               = useState(3);
  const [budget, setBudget]           = useState("20000");
  const [preferences, setPreferences] = useState("beaches, culture");
  const [isLoading, setIsLoading]     = useState(false);
  const [result, setResult]           = useState<ItineraryResponse | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateAIItinerary({
        city,
        days,
        budget: `${budget} INR`,
        preferences: preferences.split(",").map(p => p.trim()).filter(Boolean),
      });
      setResult(data);
      setShowPreview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Generate AI Itinerary</h3>
                <p className="text-white/60 text-xs">Powered by Ollama + RAG</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Destination</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Goa"
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Budget (INR)</label>
            <input
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="e.g. 20000"
              className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Interests (comma-separated)</label>
            <input
              value={preferences}
              onChange={e => setPreferences(e.target.value)}
              placeholder="e.g. beaches, nightlife, culture"
              className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-3 rounded-xl">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Result Preview */}
          {result && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowPreview(v => !v)}
                className="w-full flex items-center justify-between p-4 text-sm font-bold text-indigo-700 dark:text-indigo-300"
              >
                <span>✅ Itinerary ready — {result.destination}, {result.duration_days} days</span>
                {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showPreview && (
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                  {result.itinerary.slice(0, 3).map(d => (
                    <div key={d.day} className="text-xs text-indigo-800 dark:text-indigo-200">
                      <span className="font-bold">Day {d.day}:</span>{" "}
                      {d.activities.slice(0, 2).join(" · ")}
                      {d.activities.length > 2 && " ..."}
                    </div>
                  ))}
                  {result.itinerary.length > 3 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      + {result.itinerary.length - 3} more days
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !city.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-400/20 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> {result ? "Regenerate" : "Generate Itinerary"}</>
              )}
            </button>

            {result && (
              <button
                onClick={() => { onApply(result); onClose(); }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-400/20 hover:-translate-y-0.5"
              >
                <CheckCheck size={16} /> Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ItineraryPlanner component ───────────────────────────────────────────
export default function ItineraryPlanner() {
  const [itinerary, setItinerary]           = useState(DEFAULT_ITINERARY);
  const [showAIPanel, setShowAIPanel]       = useState(false);
  const [aiMetadata, setAiMetadata]         = useState<{ destination: string; budget: string } | null>(null);

  const handleApplyAI = (result: ItineraryResponse) => {
    setItinerary(aiDaysToStops(result.itinerary));
    setAiMetadata({ destination: result.destination, budget: result.budget_estimate });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex gap-6 lg:gap-8 flex-col lg:flex-row h-auto min-h-[800px] lg:h-[1000px] mb-12">

      {/* AI Generate Panel (modal) */}
      {showAIPanel && (
        <AIGeneratePanel
          onApply={handleApplyAI}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Saved Destinations Sidebar */}
      <div className="w-full lg:w-80 bg-white rounded-[1.25rem] border border-gray-100 flex flex-col shrink-0 shadow-sm h-full">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-[1.25rem] shrink-0 flex justify-between items-center">
          <h3 className="font-heading font-bold text-gray-900 flex items-center gap-2">
            <Compass className="text-blue-600" size={20} /> Saved Places
          </h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">8 Items</span>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-gray-50">
          <p className="text-sm text-gray-500 mb-4 font-medium">Drag items to add to your itinerary.</p>

          {SAVED_PLACES.map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 cursor-grab hover:border-blue-300 hover:shadow-md transition-all active:cursor-grabbing">
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{item.type}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="flex items-center gap-1"><Clock size={10} /> {item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Itinerary Timeline */}
      <div className="flex-1 bg-white rounded-[1.25rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-bold text-xl text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} /> Day-by-day Plan
            </h2>
            {aiMetadata && (
              <span className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                <Sparkles size={11} /> AI: {aiMetadata.destination} · {aiMetadata.budget}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIPanel(true)}
              id="ai-generate-itinerary-btn"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-400/20 hover:-translate-y-0.5"
            >
              <Sparkles size={15} /> Generate AI Itinerary
            </button>
            <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-blue-100">
              <MapIcon size={16} /> Map View
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-gray-50/50">
          {itinerary.map((day) => (
            <div key={day.day} className="relative">
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center mb-6">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-bold text-lg text-gray-900">Day {day.day}</h3>
                  <span className="text-sm font-medium text-gray-500">{day.date}</span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Stop</button>
              </div>

              <div className="ml-6 space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-blue-100 before:-z-10">
                {day.stops.map((stop, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-6 h-6 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm mt-1 z-10 group-hover:bg-blue-500 transition-colors group-hover:border-blue-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 group-hover:bg-white" />
                    </div>

                    <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group-hover:-translate-y-0.5 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400">
                        <GripVertical size={16} />
                      </div>

                      <div className="flex items-start justify-between pl-4 md:pl-0 group-hover:pl-6 transition-all duration-200">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{stop.time}</span>
                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                              <Clock size={12} /> {stop.duration}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg">{stop.title}</h4>
                        </div>
                        <button className="text-gray-400 hover:text-red-500 transition-colors p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
                          </svg>
                        </button>
                      </div>

                      {i < day.stops.length - 1 && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center gap-3 text-xs text-gray-500 pl-4 md:pl-0 group-hover:pl-6 transition-all">
                          <span className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                            🚗 25 min drive
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty Drop Zone */}
                <div className="flex gap-6 pt-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 border-4 border-[#F8F5F0] flex items-center justify-center shrink-0 z-10" />
                  <div className="flex-1 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl p-4 flex items-center justify-center text-blue-500 font-medium text-sm">
                    Drag destination here
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
