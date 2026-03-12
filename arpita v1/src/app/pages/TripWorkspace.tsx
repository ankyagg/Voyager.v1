import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { socket } from "../imports/socket";
import { Calendar, Users, MapPin, Wallet, Settings, Pencil, ChevronRight, MessageSquare, Image as ImageIcon, Map, Search, Star, MessageCircle, MoreHorizontal } from "lucide-react";
import ItineraryPlanner from "../components/ItineraryPlanner";
import BudgetTracker from "./BudgetTracker";
import DestinationDiscovery from "./DestinationDiscovery";
import AIAssistantSidebar from "../components/AIAssistantSidebar";

export default function TripWorkspace() {
  const { tripId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (tripId) {
      socket.emit("join_trip", tripId);
      
      socket.on("itinerary_updated", (data) => {
        console.log("Itinerary updated by teammate:", data);
        // TODO: Update local state with new itinerary data
      });

      socket.on("budget_updated", (data) => {
        console.log("Budget updated by teammate:", data);
        // TODO: Update local state with new budget data
      });
    }

    return () => {
      socket.off("itinerary_updated");
      socket.off("budget_updated");
    };
  }, [tripId]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "itinerary", label: "Itinerary" },
    { id: "destinations", label: "Destinations" },
    { id: "budget", label: "Budget" },
    { id: "discussion", label: "Discussion" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F5F0]">
      {/* Top Section */}
      <div className="bg-white border-b border-gray-200 shrink-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
              <span className="hover:text-gray-900 cursor-pointer transition-colors">My Trips</span>
              <ChevronRight size={16} />
              <span className="text-blue-600">Bali Retreat 2026</span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold font-heading text-gray-900">Bali Retreat 2026</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wider">Confirmed</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Calendar size={16} className="text-blue-600" />
                Oct 12 - Oct 20, 2026
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <MapPin size={16} className="text-blue-600" />
                Bali, Indonesia
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Wallet size={16} className="text-[#2A9D8F]" />
                <span className="font-semibold text-gray-900">$4,500</span> / $6,000
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm ring-2 ring-gray-50/50">
                  U{i}
                </div>
              ))}
              <button className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-medium text-sm hover:bg-gray-200 transition-colors">
                +2
              </button>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-full font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
              <Pencil size={18} className="text-gray-500" /> Edit Trip
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center gap-8 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 pt-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 px-1 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && <TripOverview />}
        {activeTab === "itinerary" && <ItineraryPlanner />}
        {activeTab === "destinations" && <DestinationDiscovery context="trip" />}
        {activeTab === "budget" && <BudgetTracker />}
        {activeTab === "discussion" && <TripDiscussion />}
      </div>
      <AIAssistantSidebar />
    </div>
  );
}

function TripOverview() {
  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100">
          <h2 className="font-heading font-bold text-xl mb-4 text-gray-900 flex items-center gap-2">
            <Map className="text-blue-600" size={24} /> Trip Map
          </h2>
          <div className="h-64 bg-gray-100 rounded-xl w-full flex items-center justify-center relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1080" 
              alt="Map placeholder" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" 
            />
            <div className="relative bg-white/90 backdrop-blur px-6 py-4 rounded-2xl shadow-lg border border-gray-100 text-center">
              <MapPin size={32} className="text-red-500 mx-auto mb-2" />
              <p className="font-bold text-gray-900">Bali, Indonesia</p>
              <p className="text-sm text-gray-500">Interactive map coming soon</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100">
          <h2 className="font-heading font-bold text-xl mb-4 text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} /> Up Next
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-semibold uppercase">Oct</span>
                <span className="text-lg font-bold leading-none">12</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Flight to Denpasar</h4>
                <p className="text-sm text-gray-600 mt-1">Garuda Indonesia GA-802 • 14:30 PM Departure</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-12 h-12 bg-white border border-gray-200 text-gray-500 rounded-xl flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-semibold uppercase">Oct</span>
                <span className="text-lg font-bold leading-none">12</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Check-in at Alila Villas</h4>
                <p className="text-sm text-gray-600 mt-1">Uluwatu, Bali • 18:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100">
          <h2 className="font-heading font-bold text-lg mb-4 text-gray-900">Activity Feed</h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <span className="text-sm font-bold">JD</span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-sm text-gray-800"><span className="font-semibold">John D.</span> added a new destination <span className="font-semibold text-blue-600">Potato Head Beach Club</span></p>
                <span className="text-xs text-gray-400 mt-1 block">2 hours ago</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-green-100 text-green-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <span className="text-sm font-bold">SJ</span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-sm text-gray-800"><span className="font-semibold">Sarah J.</span> updated Day 2 itinerary</p>
                <span className="text-xs text-gray-400 mt-1 block">5 hours ago</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-purple-100 text-purple-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <Sparkles size={16} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm text-gray-800"><span className="font-semibold text-blue-700">Voyager AI</span> generated a draft itinerary</p>
                <span className="text-xs text-blue-400 mt-1 block">1 day ago</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function TripDiscussion() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="bg-white rounded-t-[1.25rem] p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h2 className="font-heading font-bold text-xl text-gray-900 flex items-center gap-2">
          <MessageCircle className="text-blue-600" size={24} /> Team Discussion
        </h2>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-white p-6 overflow-y-auto space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold">JD</div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-gray-900">John Doe</span>
              <span className="text-xs text-gray-500">10:42 AM</span>
            </div>
            <p className="text-gray-700 bg-gray-50 inline-block p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
              Hey everyone! I've added a few restaurant options for our first night in Seminyak. What does everyone think about seafood? 🦐
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-bold">SJ</div>
          <div className="flex-1 flex flex-col items-end">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-gray-500">11:05 AM</span>
              <span className="font-semibold text-gray-900">Sarah Jenkins</span>
            </div>
            <p className="text-white bg-blue-600 inline-block p-3 rounded-2xl rounded-tr-sm shadow-sm">
              Seafood sounds perfect! I saw Jimbaran Bay is famous for it. Can we fit that in?
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold">JD</div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-gray-900">John Doe</span>
              <span className="text-xs text-gray-500">11:12 AM</span>
            </div>
            <p className="text-gray-700 bg-gray-50 inline-block p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
              Yes, let me ask Voyager to schedule it for Day 2 sunset.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-gray-100 rounded-b-[1.25rem] shrink-0">
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ImageIcon size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-gray-100 border-none rounded-full py-3 px-5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
          <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
            <MessageSquare size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
