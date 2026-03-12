import { Search, MapPin, Star, Heart, Filter } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      
      // If we are scrolling UP (current < last), hide it
      // If we are scrolling DOWN (current > last), show it
      if (currentScrollY > lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(false);
      }

      // Always show at the very top
      if (currentScrollY < 10) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

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

        {/* Sticky Search Bar */}
        <div 
          className={`bg-white/80 dark:bg-card/80 backdrop-blur-xl p-4 rounded-3xl shadow-2xl shadow-indigo-900/10 dark:shadow-black/40 border border-white/20 dark:border-white/5 flex gap-4 mb-8 sticky top-4 z-30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
            isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-20 opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search places, attractions, restaurants..." 
              className="w-full bg-accent/50 dark:bg-muted/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-card transition-all outline-none font-medium placeholder:text-muted-foreground/60"
            />
          </div>
          <button className="px-5 py-3.5 bg-accent/50 dark:bg-muted/50 hover:bg-white dark:hover:bg-card text-foreground rounded-2xl flex items-center gap-2.5 text-sm font-bold transition-all border border-transparent hover:border-border hover:shadow-md">
            <Filter size={18} className="text-indigo-600 dark:text-indigo-400" /> Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <div key={dest.id} className="bg-card rounded-[2rem] overflow-hidden shadow-sm border border-border/40 group hover:shadow-2xl hover:shadow-indigo-900/10 transition-all hover:-translate-y-2 duration-500 flex flex-col">
              <div className="relative h-56 overflow-hidden shrink-0">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <button 
                  onClick={() => toggleSave(dest.id)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/90 dark:bg-card/90 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all shadow-lg border border-white/20 dark:border-white/10"
                >
                  <Heart 
                    size={18} 
                    className={saved.includes(dest.id) ? "fill-rose-500 text-rose-500" : ""} 
                  />
                </button>
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
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
                    onClick={() => toggleSave(dest.id)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                      saved.includes(dest.id)
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                        : "bg-white dark:bg-accent/50 border-gray-100 dark:border-transparent text-foreground hover:bg-gray-50 hover:shadow-md"
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
    </div>
  );
}
