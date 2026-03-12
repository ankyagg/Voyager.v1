import { Search, MapPin, Star, Heart, Filter, X, Check } from "lucide-react";
import { useState, useRef } from "react";
import places from "../../data/places.json";
import { useTrips } from "../contexts/TripContext";

// convert a Wikimedia Commons URL into a smaller thumbnail version
function wikimediaThumb(origUrl: string, width = 400) {
  try {
    const parts = origUrl.split("/commons/");
    if (parts.length < 2) return origUrl;
    const filepath = parts[1]; // e.g. "0/09/India_Gate...jpg"
    const basename = filepath.substring(filepath.lastIndexOf("/") + 1);
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filepath}/${width}px-${basename}`;
  } catch {
    return origUrl;
  }
}

export default function DestinationDiscovery({ context = "global", tripIdForContext }: { context?: "global" | "trip", tripIdForContext?: string }) {
  const { trips, savePlaceToTrip, removePlaceFromTrip } = useTrips();
  
  const initialSearch = () => {
    if (context === "trip" && tripIdForContext) {
      const activeTrip = trips.find(t => t.id === tripIdForContext);
      if (activeTrip && activeTrip.location) {
        return activeTrip.location.split(',')[0]; // e.g., "Delhi" from "Delhi, India"
      }
    }
    return "";
  };

  const [searchQuery, setSearchQuery] = useState(initialSearch());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPlaceToSave, setSelectedPlaceToSave] = useState<{id: number; name: string} | null>(null);

  const getSavedTripsForPlace = (placeId: number) => {
    return trips.filter(t => t.savedPlaces.includes(placeId));
  };

  const destinations = places.map((p: any, idx: number) => ({
    id: p["Unnamed: 0"] ?? idx,
    name: p.Name,
    location: `${p.City}, ${p.State}`,
    rating: p["Google review rating"],
    reviews: "",
    image: p.image_url
             ? wikimediaThumb(p.image_url, 400)
             : "/fallback.png",
    category: p.Type,
  }));

  const filteredDestinations = destinations.filter(dest => {
    const query = searchQuery.toLowerCase();
    return (
      (dest.name && dest.name.toLowerCase().includes(query)) ||
      (dest.location && dest.location.toLowerCase().includes(query)) ||
      (dest.category && dest.category.toLowerCase().includes(query))
    );
  });

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto custom-scrollbar"
    >
      <div className={`max-w-7xl mx-auto ${context === "global" ? "p-8" : "p-6"}`}>
        {context === "global" && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">Discover & Save</h1>
            <p className="text-gray-500 mt-1 font-medium">Find places to go, things to do, and where to eat.</p>
          </div>
        )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 mb-8 sticky top-4 z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search places, attractions, restaurants..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <button className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors border border-gray-200">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDestinations.map((dest) => (
          <div key={dest.id} className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all hover:-translate-y-1 duration-300 flex flex-col">
            <div className="relative h-48 overflow-hidden shrink-0">
              <img 
                src={dest.image} 
                alt={dest.name} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <button 
                onClick={() => setSelectedPlaceToSave({ id: dest.id, name: dest.name })}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm"
              >
                <Heart 
                  size={16} 
                  className={getSavedTripsForPlace(dest.id).length > 0 ? "fill-red-500 text-red-500" : ""} 
                />
              </button>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                {dest.category}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-foreground line-clamp-1 flex-1 pr-2 font-heading" title={dest.name}>{dest.name}</h3>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg text-xs font-black shrink-0 border border-amber-100 dark:border-amber-500/20">
                  <Star size={12} className="fill-amber-500 text-amber-500" /> {dest.rating}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mb-6 font-medium">
                <MapPin size={14} className="mr-1.5 shrink-0 text-rose-500" />
                <span className="truncate">{dest.location}</span>
              </div>
              
              <div className="mt-auto">
                <button 
                  onClick={() => setSelectedPlaceToSave({ id: dest.id, name: dest.name })}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                    getSavedTripsForPlace(dest.id).length > 0
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                      : "bg-white dark:bg-accent/50 border-gray-100 dark:border-transparent text-foreground hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  {getSavedTripsForPlace(dest.id).length > 0 ? "Manage Saved Trips" : "Save to Trip"}
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* ===== SAVE PLACE MODAL ===== */}
      {selectedPlaceToSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlaceToSave(null)} />
          
          <div className="relative bg-white dark:bg-card w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all">
            <button 
              onClick={() => setSelectedPlaceToSave(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold font-heading mb-2 dark:text-white pr-8">Save <span className="text-indigo-600 dark:text-indigo-400">{selectedPlaceToSave.name}</span> to</h3>
            <p className="text-sm text-muted-foreground mb-6">Choose which trip you'd like to add this destination to.</p>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {trips.length === 0 ? (
                <div className="text-center py-6 bg-muted/50 rounded-xl border border-dashed border-border">
                  <p className="text-sm font-medium text-muted-foreground">You don't have any trips yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Go to Dashboard to create one!</p>
                </div>
              ) : (
                trips.map(trip => {
                  const isSaved = trip.savedPlaces.includes(selectedPlaceToSave.id);
                  return (
                    <div 
                      key={trip.id}
                      onClick={() => {
                        if (isSaved) removePlaceFromTrip(trip.id, selectedPlaceToSave.id);
                        else savePlaceToTrip(trip.id, selectedPlaceToSave.id);
                      }}
                      className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSaved 
                          ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800" 
                          : "bg-background border-border hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    >
                      <img src={trip.image} alt={trip.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{trip.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{trip.dates}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                        isSaved 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "bg-transparent border-gray-300 dark:border-gray-600"
                      }`}>
                        {isSaved && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button 
              onClick={() => setSelectedPlaceToSave(null)}
              className="w-full mt-6 py-3.5 bg-foreground text-background dark:bg-white dark:text-black font-bold rounded-xl text-sm hover:scale-[1.02] transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
