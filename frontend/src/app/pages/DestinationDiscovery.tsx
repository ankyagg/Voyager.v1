import { Search, MapPin, Star, Heart, Filter } from "lucide-react";
import { useState } from "react";

export default function DestinationDiscovery({ context = "global" }: { context?: "global" | "trip" }) {
  const [saved, setSaved] = useState<number[]>([1, 3]);

  const toggleSave = (id: number) => {
    if (saved.includes(id)) {
      setSaved(saved.filter(s => s !== id));
    } else {
      setSaved([...saved, id]);
    }
  };

  const destinations = [
    {
      id: 1,
      name: "Tanah Lot Temple",
      location: "Tabanan, Bali",
      rating: 4.8,
      reviews: "12k",
      image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=800",
      category: "Sightseeing"
    },
    {
      id: 2,
      name: "Potato Head Beach Club",
      location: "Seminyak, Bali",
      rating: 4.6,
      reviews: "8.5k",
      image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800",
      category: "Food & Drinks"
    },
    {
      id: 3,
      name: "Ubud Monkey Forest",
      location: "Ubud, Bali",
      rating: 4.5,
      reviews: "15k",
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=800",
      category: "Nature"
    },
    {
      id: 4,
      name: "Tegalalang Rice Terrace",
      location: "Ubud, Bali",
      rating: 4.7,
      reviews: "10k",
      image: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&q=80&w=800",
      category: "Nature"
    },
    {
      id: 5,
      name: "Locavore",
      location: "Ubud, Bali",
      rating: 4.9,
      reviews: "2.1k",
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800",
      category: "Fine Dining"
    },
    {
      id: 6,
      name: "Finns Beach Club",
      location: "Canggu, Bali",
      rating: 4.5,
      reviews: "9k",
      image: "https://images.unsplash.com/photo-1590523265585-236f80f78c11?auto=format&fit=crop&q=80&w=800",
      category: "Entertainment"
    }
  ];

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
