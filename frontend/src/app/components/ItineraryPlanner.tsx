import { GripVertical, Clock, MapPin, Map as MapIcon, Calendar, Compass, ArrowRight } from "lucide-react";

export default function ItineraryPlanner() {
  const itinerary = [
    {
      day: 1,
      date: "Mon, Oct 12",
      stops: [
        { time: "09:00 AM", title: "Breakfast at Sisterfields", type: "food", duration: "1h" },
        { time: "11:00 AM", title: "Seminyak Beach Surf", type: "activity", duration: "3h" },
        { time: "05:00 PM", title: "Sunset at Potato Head", type: "drinks", duration: "4h" }
      ]
    },
    {
      day: 2,
      date: "Tue, Oct 13",
      stops: [
        { time: "08:30 AM", title: "Ubud Monkey Forest", type: "activity", duration: "2h" },
        { time: "11:30 AM", title: "Tegalalang Rice Terrace", type: "sightseeing", duration: "2h" },
        { time: "02:00 PM", title: "Lunch at Locavore", type: "food", duration: "1.5h" },
        { time: "07:00 PM", title: "Dinner at Jimbaran Bay", type: "food", duration: "2h" }
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex gap-6 lg:gap-8 flex-col lg:flex-row h-auto min-h-[800px] lg:h-[1000px] mb-12">
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
          
          {[
            { name: "Tanah Lot Temple", type: "Sightseeing", time: "2h" },
            { name: "Finns Beach Club", type: "Entertainment", time: "4h" },
            { name: "Campuhan Ridge Walk", type: "Activity", time: "1.5h" },
            { name: "Nusa Penida Day Trip", type: "Activity", time: "Full Day" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 cursor-grab hover:border-blue-300 hover:shadow-md transition-all active:cursor-grabbing">
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{item.type}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
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
          <h2 className="font-heading font-bold text-xl text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} /> Day-by-day Plan
          </h2>
          <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-blue-100">
            <MapIcon size={16} /> Map View
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-gray-50/50">
          {itinerary.map((day, dayIndex) => (
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
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 group-hover:bg-white"></div>
                    </div>
                    
                    <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group-hover:-translate-y-0.5 relative">
                      {/* Drag Handle */}
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
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
                  <div className="w-6 h-6 rounded-full bg-gray-100 border-4 border-[#F8F5F0] flex items-center justify-center shrink-0 z-10"></div>
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
