import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { GripVertical, Clock, MapPin, Map as MapIcon, Calendar, Compass, ArrowRight, Trash2, Sparkles, Loader2 } from "lucide-react";
import { socket } from "../imports/socket";

interface Stop {
  id: string;
  time: string;
  title: string;
  type: string;
  duration: string;
}

interface DayPlan {
  day: number;
  date: string;
  stops: Stop[];
}

export default function ItineraryPlanner() {
  const { tripId } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<DayPlan[]>([
    {
      day: 1,
      date: "Mon, Oct 12",
      stops: [
        { id: "1", time: "09:00 AM", title: "Breakfast at Sisterfields", type: "food", duration: "1h" },
        { id: "2", time: "11:00 AM", title: "Seminyak Beach Surf", type: "activity", duration: "3h" },
      ]
    },
    {
      day: 2,
      date: "Tue, Oct 13",
      stops: [
        { id: "3", time: "08:30 AM", title: "Ubud Monkey Forest", type: "activity", duration: "2h" },
      ]
    }
  ]);

  useEffect(() => {
    // Listen for updates from teammates
    socket.on("itinerary_updated", (data: any) => {
      if (data.tripId === tripId) {
        setItinerary(data.itinerary);
      }
    });

    return () => {
      socket.off("itinerary_updated");
    };
  }, [tripId]);

  const updateAndBroadcast = (newItinerary: DayPlan[]) => {
    setItinerary(newItinerary);
    socket.emit("itinerary_update", {
      tripId,
      itinerary: newItinerary
    });
  };

  const removeStop = (dayNum: number, stopId: string) => {
    const newItinerary = itinerary.map(day => {
      if (day.day === dayNum) {
        return { ...day, stops: day.stops.filter(s => s.id !== stopId) };
      }
      return day;
    });
    updateAndBroadcast(newItinerary);
  };

  const addDay = () => {
    const nextDay = itinerary.length + 1;
    const newDay: DayPlan = {
      day: nextDay,
      date: "Next Day",
      stops: []
    };
    updateAndBroadcast([...itinerary, newDay]);
  };

  const generateMagicItinerary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:5000/api/ai/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          city: "Bali", 
          days: 3, 
          budget: 5000, 
          preferences: ["Beaches", "Culture"] 
        }),
      });
      const data = await response.json();
      
      const generatedPlan = data.itinerary.daily_plans.map((day: any) => ({
        day: day.day,
        date: `Day ${day.day}`,
        stops: day.activities.map((act: any, idx: number) => ({
          id: `ai-${day.day}-${idx}`,
          time: act.time,
          title: act.place,
          type: "activity",
          duration: "2h"
        }))
      }));
      
      updateAndBroadcast(generatedPlan);
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8 flex-col lg:flex-row h-[calc(100vh-200px)]">
      {/* Saved Destinations Sidebar (Mock for now) */}
      <div className="w-full lg:w-80 bg-white rounded-[1.25rem] border border-gray-100 flex flex-col shrink-0 shadow-sm h-full">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-[1.25rem] shrink-0 flex justify-between items-center">
          <h3 className="font-heading font-bold text-gray-900 flex items-center gap-2">
            <Compass className="text-blue-600" size={20} /> Saved Places
          </h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">Draft</span>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-gray-50">
          <p className="text-sm text-gray-500 mb-4 font-medium italic">Drag/Drop coming in next 4 hours!</p>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
            Collaborative real-time sync is now ACTIVE. Changes you make will be seen by all members.
          </div>
        </div>
      </div>

      {/* Main Itinerary Timeline */}
      <div className="flex-1 bg-white rounded-[1.25rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h2 className="font-heading font-bold text-xl text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} /> Day-by-day Plan
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={generateMagicItinerary}
              disabled={isGenerating}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-200 transition-all shadow-sm flex items-center gap-2 group disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />}
              Generate AI Plan
            </button>
            <button 
              onClick={addDay}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              + Add New Day
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
              </div>

              <div className="ml-6 space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-blue-100 before:-z-10">
                {day.stops.length === 0 ? (
                  <div className="ml-10 py-8 text-sm text-gray-400 font-medium italic">No activities planned yet.</div>
                ) : (
                  day.stops.map((stop, i) => (
                    <div key={stop.id} className="flex gap-6 group">
                      <div className="w-6 h-6 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm mt-1 z-10 group-hover:bg-blue-500 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 group-hover:bg-white"></div>
                      </div>
                      
                      <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all relative">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{stop.time}</span>
                              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-tighter">
                                <Clock size={10} /> {stop.duration}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900">{stop.title}</h4>
                          </div>
                          <button 
                            onClick={() => removeStop(day.day, stop.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
