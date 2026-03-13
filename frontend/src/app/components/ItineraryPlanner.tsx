import { useState, useEffect } from "react";
import { GripVertical, Clock, Map as MapIcon, Calendar, Compass, Sparkles, Loader2, X, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Map as MapComponent, MapMarker, MarkerContent, MarkerPopup, MapControls } from "@/components/ui/map";
import { chatWithAI } from "@/lib/aiApi";
import { useItinerary } from "../contexts/ItineraryContext";
import { useItineraryMarkers } from "../hooks/useItineraryMarkers";

type ItineraryStop = {
  id: string;
  time: string;
  title: string;
  type: string;
  duration: string;
};

type ItineraryDay = {
  day: number;
  date: string;
  stops: ItineraryStop[];
};




// ── AI Generate Panel ─────────────────────────────────────────────────────────
interface AIPanelProps {
  trip?: any;
  onApplyMarkdown: (markdown: string) => void;
  onClose: () => void;
}

function AIGeneratePanel({ trip, onApplyMarkdown, onClose }: AIPanelProps) {
  const [city, setCity]               = useState("");
  const [days, setDays]               = useState(3);
  const [budget, setBudget]           = useState("20000");
  const [preferences, setPreferences] = useState("sightseeing, food, culture");
  const [isLoading, setIsLoading]     = useState(false);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setRawResponse(null);
    try {
      // Build a rich, detailed prompt identical to what the chat sidebar sends
      const prompt = `Plan a ${days}-day itinerary for ${city || "a destination"}.
Budget: ₹${budget} INR total.
Interests: ${preferences}.

Please write a detailed day-by-day travel plan. For each day, use the format:
Day N: [Title]
- Morning: [activity with brief description]
- Afternoon: [activity with brief description]
- Evening: [activity with brief description]
- Budget: ₹[amount] for this day

Include specific landmark names, local food recommendations, and practical tips. Make it feel personal and exciting!`;

      const data = await chatWithAI({ message: prompt, context: trip ? { tripId: trip.id, destination: trip.location, budget: trip.budget?.total, travelers: (trip.participantIds?.length || 0) + 1, savedPlaces: trip.savedPlaces } : undefined });
      setRawResponse(data.reply);
      setShowPreview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Generate AI Itinerary</h3>
                <p className="text-white/60 text-xs">Powered by Ollama llama3 — same as chat</p>
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Destination</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Goa, Mumbai, Bali"
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
              placeholder="e.g. beaches, nightlife, culture, street food"
              className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-3 rounded-xl">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Rich Markdown Preview — same as chat sidebar */}
          {rawResponse && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowPreview(v => !v)}
                className="w-full flex items-center justify-between p-4 text-sm font-bold text-indigo-700 dark:text-indigo-300"
              >
                <span>✅ Itinerary ready — click preview to review, then Apply</span>
                {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showPreview && (
                <div className="px-5 pb-5 max-h-64 overflow-y-auto prose prose-sm dark:prose-invert text-indigo-900 dark:text-indigo-100 text-xs leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&_strong]:font-bold">
                  {rawResponse.split("\n").map((line, i) => (
                    <p key={i} className={line.trim().match(/^Day \d+/i) ? "font-bold text-indigo-700 dark:text-indigo-300 mt-3" : ""}>{line || <br />}</p>
                  ))}
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
                <><Loader2 size={16} className="animate-spin" /> Generating with Ollama...</>
              ) : (
                <><Sparkles size={16} /> {rawResponse ? "Regenerate" : "Generate Itinerary"}</>
              )}
            </button>

            {rawResponse && (
              <button
                onClick={() => { onApplyMarkdown(rawResponse); onClose(); }}
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

import placesData from "../../data/places.json";


// ── Main ItineraryPlanner component ───────────────────────────────────────────
export default function ItineraryPlanner({ trip }: { trip?: any }) {
  const { itinerary: ctxItinerary, setItinerary: setCtxItinerary, applyFromMarkdown } = useItinerary();
  const [itinerary, _setItinerary]          = useState<ItineraryDay[]>(ctxItinerary);
  const [showAIPanel, setShowAIPanel]       = useState(false);
  const [showMapModal, setShowMapModal]     = useState(false);
  const [aiMetadata, setAiMetadata]         = useState<{ destination: string; budget: string } | null>(null);
  const [availablePlaces, setAvailablePlaces] = useState<ItineraryStop[]>([]);
  const { itineraryMarkers, mapCoords, baseCoords } = useItineraryMarkers(ctxItinerary, trip?.location || "");
  const [mapCenter, setMapCenter] = useState<[number, number]>([115.1889, -8.4095]);

  useEffect(() => {
    if (mapCoords) {
      setMapCenter(mapCoords);
    } else if (baseCoords) {
      setMapCenter(baseCoords);
    }
  }, [mapCoords, baseCoords]);

  // Keep local state in sync when context changes (e.g. Apply from chat)
  const setItinerary = (days: ItineraryDay[]) => {
    _setItinerary(days);
    setCtxItinerary(days);
  };

  useEffect(() => {
    if (ctxItinerary.length > 0) {
      _setItinerary(ctxItinerary);
    }
  }, [ctxItinerary]);

  useEffect(() => { // Keep availablePlaces synced when new places are added
    if (trip?.savedPlaces) {
      const places = placesData.filter((p: any) => trip.savedPlaces.includes(p["Unnamed: 0"])).map((p: any) => ({
        id: `place-${p["Unnamed: 0"]}`,
        time: "09:00 AM",
        title: p.Name,
        type: p.Type || "Sightseeing",
        duration: "2h"
      }));
      // Filter out places already in the itinerary
      const usedIds = new Set<string>();
      itinerary.forEach(day => day.stops.forEach(stop => usedIds.add(stop.id)));
      setAvailablePlaces(places.filter(p => !usedIds.has(p.id)));
    }
  }, [trip?.savedPlaces, itinerary]); // Note: keeping itinerary as dependency means if we delete from it, it pops back to sidebar


  const handleApplyMarkdown = (markdown: string) => {
    applyFromMarkdown(markdown);
    // try to auto-extract destination from markdown
    const destMatch = markdown.match(/itinerary for ([\w\s,]+)\./i);
    if (destMatch) {
      setAiMetadata({ destination: destMatch[1].trim(), budget: "" });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "sidebar") {
        const items = Array.from(availablePlaces);
        const [reordered] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reordered);
        setAvailablePlaces(items);
      } else {
        const dayIndex = itinerary.findIndex(d => `day-${d.day}` === source.droppableId);
        if (dayIndex === -1) return;
        
        const newItinerary = [...itinerary];
        const newStops = Array.from(newItinerary[dayIndex].stops);
        const [reordered] = newStops.splice(source.index, 1);
        newStops.splice(destination.index, 0, reordered);
        newItinerary[dayIndex] = { ...newItinerary[dayIndex], stops: newStops };
        setItinerary(newItinerary);
      }
      return;
    }

    if (source.droppableId === "sidebar" && destination.droppableId.startsWith("day-")) {
      const draggedPlace = availablePlaces[source.index];
      const dayIndex = itinerary.findIndex(d => `day-${d.day}` === destination.droppableId);
      
      const newItinerary = [...itinerary];
      const newStops = Array.from(newItinerary[dayIndex].stops);
      newStops.splice(destination.index, 0, draggedPlace);
      newItinerary[dayIndex] = { ...newItinerary[dayIndex], stops: newStops };
      setItinerary(newItinerary);
      return;
    }

    if (source.droppableId.startsWith("day-") && destination.droppableId === "sidebar") {
      const dayIndex = itinerary.findIndex(d => `day-${d.day}` === source.droppableId);
      const newItinerary = [...itinerary];
      const newStops = Array.from(newItinerary[dayIndex].stops);
      newStops.splice(source.index, 1);
      newItinerary[dayIndex] = { ...newItinerary[dayIndex], stops: newStops };
      setItinerary(newItinerary);
      return;
    }

    if (source.droppableId.startsWith("day-") && destination.droppableId.startsWith("day-")) {
      const srcIndex = itinerary.findIndex(d => `day-${d.day}` === source.droppableId);
      const destIndex = itinerary.findIndex(d => `day-${d.day}` === destination.droppableId);
      
      const newItinerary = [...itinerary];
      const srcStops = Array.from(newItinerary[srcIndex].stops);
      const destStops = Array.from(newItinerary[destIndex].stops);
      const [movedStop] = srcStops.splice(source.index, 1);
      destStops.splice(destination.index, 0, movedStop);
      
      newItinerary[srcIndex] = { ...newItinerary[srcIndex], stops: srcStops };
      newItinerary[destIndex] = { ...newItinerary[destIndex], stops: destStops };
      setItinerary(newItinerary);
      return;
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex gap-6 lg:gap-8 flex-col lg:flex-row h-auto min-h-[800px] lg:h-[1000px] mb-12">

      {/* AI Generate Panel (modal) */}
      {showAIPanel && (
        <AIGeneratePanel
          trip={trip}
          onApplyMarkdown={handleApplyMarkdown}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Saved Destinations Sidebar */}
      <div className="w-full lg:w-80 bg-white rounded-[1.25rem] border border-gray-100 flex flex-col shrink-0 shadow-sm h-full">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-[1.25rem] shrink-0 flex justify-between items-center">
          <h3 className="font-heading font-bold text-gray-900 flex items-center gap-2">
            <Compass className="text-blue-600" size={20} /> Saved Places
          </h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{availablePlaces.length} Items</span>
        </div>
        <Droppable droppableId="sidebar">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="p-5 space-y-4 overflow-y-auto flex-1 bg-gray-50 min-h-[200px]"
            >
              <p className="text-sm text-gray-500 mb-4 font-medium">Drag items to add to your itinerary.</p>

              {availablePlaces.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No saved places yet. Save some from the Destinations tab!</p>
              ) : (
                availablePlaces.map((item, i) => (
                  <Draggable key={item.id} draggableId={item.id} index={i}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-white p-3 rounded-xl border ${snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md'} flex items-center gap-3 cursor-grab transition-all`}
                        style={{...provided.draggableProps.style}}
                      >
                        <GripVertical size={16} className="text-gray-300 shrink-0 pointer-events-none" />
                        <div className="flex-1 min-w-0 pointer-events-none">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{item.type}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><Clock size={10} /> {item.duration}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
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
            <button 
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-blue-100"
            >
              <MapIcon size={16} /> Map View
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-gray-50/50">
          {itinerary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <Calendar className="text-blue-300" size={32} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">No Itinerary Generated Yet</h3>
              <p className="text-gray-500 text-sm max-w-sm">Use the AI generator or start dragging your saved places here to build out your ultimate {trip?.location || "trip"} plan.</p>
            </div>
          ) : (
            itinerary.map((day) => (
              <div key={day.day} className="relative">
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center mb-6">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-bold text-lg text-gray-900">Day {day.day}</h3>
                    <span className="text-sm font-medium text-gray-500">{day.date}</span>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Stop</button>
                </div>

                <Droppable droppableId={`day-${day.day}`}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`ml-6 space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-blue-100 before:-z-10 min-h-[150px] p-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                    >
                      {day.stops.map((stop, i) => (
                        <Draggable key={stop.id} draggableId={stop.id} index={i}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex gap-6 group ${snapshot.isDragging ? 'z-50' : ''}`}
                              style={{...provided.draggableProps.style}}
                            >
                              <div className="w-6 h-6 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm mt-1 z-10 group-hover:bg-blue-500 transition-colors group-hover:border-blue-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 group-hover:bg-white" />
                              </div>

                              <div className={`flex-1 bg-white p-4 rounded-xl border ${snapshot.isDragging ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md'} transition-all group-hover:-translate-y-0.5 relative`}>
                                <div 
                                  {...provided.dragHandleProps}
                                  className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400"
                                >
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
                                  <button onClick={() => {
                                      // Optional: Add simple delete button without bringing it back to available places
                                      const newIt = [...itinerary];
                                      const dayIndex = newIt.findIndex(d => d.day === day.day);
                                      newIt[dayIndex].stops = newIt[dayIndex].stops.filter(s => s.id !== stop.id);
                                      setItinerary([...newIt]);
                                    }} className="text-gray-400 hover:text-red-500 transition-colors p-2">
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty Drop Zone visually */}
                      {day.stops.length === 0 && (
                        <div className="flex gap-6 pt-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-4 border-[#F8F5F0] flex items-center justify-center shrink-0 z-10" />
                          <div className="flex-1 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl p-4 flex items-center justify-center text-blue-500 font-medium text-sm">
                            Drag destination here
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Full Screen Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-[95vw] h-[90vh] bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                  <MapIcon className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="font-heading font-black text-2xl text-white drop-shadow-lg leading-none">Trip Explorer</h2>
                  <p className="text-white/70 text-sm font-bold mt-1 uppercase tracking-widest">{trip?.location}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMapModal(false)}
                className="pointer-events-auto w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white transition-all transform hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
              <MapComponent
                key={mapCenter.join(',')}
                center={mapCenter}
                zoom={12}
                className="w-full h-full"
              >
                <MapControls position="bottom-right" />
                {itineraryMarkers.map((marker, idx) => (
                  <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
                    <MarkerContent>
                      <div className="relative group cursor-pointer scale-110">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                        <div className="relative w-10 h-10 bg-white dark:bg-indigo-950 rounded-2xl rotate-45 border-2 border-indigo-600 shadow-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:-translate-y-1 transition-all">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 -rotate-45">{idx + 1}</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-indigo-900 border border-indigo-400/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap pointer-events-none">
                          {marker.title}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-900 rotate-45 -mt-1 border-r border-b border-indigo-400/30" />
                        </div>
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="p-5 bg-card min-w-[300px] rounded-3xl overflow-hidden shadow-2xl border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                                {idx + 1}
                              </div>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{marker.type}</span>
                           </div>
                           <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-500/30">{marker.time}</span>
                        </div>
                        <h4 className="font-heading font-black text-foreground text-xl mb-3 leading-tight">{marker.title}</h4>
                        <div className="w-full h-px bg-gradient-to-r from-indigo-500/50 to-transparent mb-4" />
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">This is your #{idx + 1} stop in {trip?.location}. Get ready for an amazing experience!</p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                ))}
              </MapComponent>

              {/* Stats Legend overlay */}
              <div className="absolute bottom-10 left-10 p-5 bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl flex gap-6 z-10 animate-in slide-in-from-left-10 duration-500">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Stops</span>
                  <span className="text-3xl font-black text-foreground tabular-nums">{itineraryMarkers.length}</span>
                </div>
                <div className="w-px h-10 bg-border/50" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Trip Coverage</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{Math.min(100, Math.round((itineraryMarkers.length / (ctxItinerary.length * 3)) * 100))}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DragDropContext>
  );
}
