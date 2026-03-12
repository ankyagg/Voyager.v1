import { Calendar, Users, MapPin, Plus, Wallet } from "lucide-react";
import { Link } from "react-router";

export default function TripDashboard() {
  const trips = [
    {
      id: "trip-1",
      name: "Bali Retreat 2026",
      image: "https://images.unsplash.com/photo-1724568834522-81eb8e5c048c?auto=format&fit=crop&q=80&w=1080",
      dates: "Oct 12 - Oct 20, 2026",
      travelers: 4,
      budget: { spent: 4500, total: 6000 },
      location: "Bali, Indonesia"
    },
    {
      id: "trip-2",
      name: "Tokyo Neon Lights",
      image: "https://images.unsplash.com/photo-1662107399413-ccaf9bbb1ce9?auto=format&fit=crop&q=80&w=1080",
      dates: "Dec 5 - Dec 15, 2026",
      travelers: 2,
      budget: { spent: 2100, total: 5000 },
      location: "Tokyo, Japan"
    },
    {
      id: "trip-3",
      name: "Paris Getaway",
      image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&q=80&w=1080",
      dates: "May 1 - May 8, 2026",
      travelers: 3,
      budget: { spent: 1200, total: 3500 },
      location: "Paris, France"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground">My Trips</h1>
          <p className="text-muted-foreground mt-1">Manage all your upcoming and past adventures.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
          <Plus size={18} /> Create New Trip
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trips.map(trip => (
          <div key={trip.id} className="bg-card rounded-[1.25rem] overflow-hidden shadow-sm border border-border group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={trip.image} 
                alt={trip.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-card-foreground flex items-center gap-1.5 border border-border">
                <MapPin size={12} className="text-blue-600" /> {trip.location}
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="font-heading font-bold text-xl text-foreground mb-4">{trip.name}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={16} className="text-muted-foreground mr-3" />
                  {trip.dates}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users size={16} className="text-muted-foreground mr-3" />
                  {trip.travelers} Travelers
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Wallet size={16} className="text-[#2A9D8F] mr-3" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">${trip.budget.spent} spent</span>
                      <span className="text-muted-foreground">of ${trip.budget.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#2A9D8F] rounded-full" 
                        style={{ width: `${(trip.budget.spent / trip.budget.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <Link 
                to={`/dashboard/trips/${trip.id}`} 
                className="block w-full py-2.5 bg-secondary hover:bg-blue-600 hover:text-white text-foreground font-medium text-center rounded-xl transition-all border border-border"
              >
                Open Trip
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
