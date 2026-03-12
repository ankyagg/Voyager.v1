import { Search, MapPin, Star, Heart, Filter } from "lucide-react";
import { useState } from "react";
import places from "../../data/places.json"

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

export default function DestinationDiscovery({ context = "global" }: { context?: "global" | "trip" }) {
  const [saved, setSaved] = useState<number[]>([1, 3]);

  const toggleSave = (id: number) => {
    if (saved.includes(id)) {
      setSaved(saved.filter(s => s !== id));
    } else {
      setSaved([...saved, id]);
    }
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

  return (
    <div className={`max-w-7xl mx-auto ${context === "global" ? "p-8" : "p-6"}`}>
      {context === "global" && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-gray-900">Discover & Save</h1>
          <p className="text-gray-500 mt-1">Find places to go, things to do, and where to eat.</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 mb-8 sticky top-4 z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search places, attractions, restaurants..." 
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <button className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors border border-gray-200">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {destinations.map((dest) => (
          <div key={dest.id} className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all hover:-translate-y-1 duration-300 flex flex-col">
            <div className="relative h-48 overflow-hidden shrink-0">
              <img 
                src={dest.image} 
                alt={dest.name} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <button 
                onClick={() => toggleSave(dest.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm"
              >
                <Heart 
                  size={16} 
                  className={saved.includes(dest.id) ? "fill-red-500 text-red-500" : ""} 
                />
              </button>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                {dest.category}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex-1 pr-2" title={dest.name}>{dest.name}</h3>
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-bold shrink-0">
                  <Star size={12} className="fill-yellow-500 text-yellow-500" /> {dest.rating}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <MapPin size={14} className="mr-1 shrink-0" />
                <span className="truncate">{dest.location}</span>
              </div>
              
              <div className="mt-auto">
                <button 
                  onClick={() => toggleSave(dest.id)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors border ${
                    saved.includes(dest.id)
                      ? "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {saved.includes(dest.id) ? "Saved to Trip" : "Save to Trip"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
