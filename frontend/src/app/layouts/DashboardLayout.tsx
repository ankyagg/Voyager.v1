import { Compass, Home, MapPin, Wallet, Sparkles, Settings, User, Bell, Map, ChevronDown, Moon, Sun } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardLayout() {
  const location = useLocation();
  const [aiOpen, setAiOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { dbUser } = useAuth();

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard", exact: true },
    { icon: Map, label: "My Trips", path: "/dashboard/trips", exact: false },
    { icon: MapPin, label: "Saved Places", path: "/dashboard/saved", exact: false },
    { icon: Wallet, label: "Budget Tracker", path: "/dashboard/budget", exact: false },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Compass size={20} />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-blue-900">
              Voyager
            </span>
          </div>

          <nav className="px-4 py-2 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Main Navigation</div>
            {navItems.map((item) => {
              const active = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon size={18} className={active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <nav className="px-4 py-6 space-y-1 mt-6 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Tools</div>
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-gray-600 hover:bg-[#2A9D8F]/10 hover:text-[#2A9D8F] group"
            >
              <Sparkles size={18} className="text-[#2A9D8F] group-hover:text-[#2A9D8F]" />
              AI Assistant
            </button>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-gray-600 hover:bg-gray-50 hover:text-gray-900 group"
            >
              <Settings size={18} className="text-gray-400 group-hover:text-gray-600" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white">
              {dbUser?.displayName ? dbUser.displayName.charAt(0).toUpperCase() : "E"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{dbUser?.displayName || "Explorer"}</p>
              <p className="text-xs text-gray-500 truncate">{dbUser?.email || "No email"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 backdrop-blur-sm transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 backdrop-blur-sm transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 backdrop-blur-sm transition-colors">
            <User size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-background">
          <Outlet />
        </div>

        {/* Floating AI Assistant Widget */}
        {aiOpen && (
          <div className="absolute bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px] z-50">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-heading font-semibold">Voyager AI</span>
              </div>
              <button onClick={() => setAiOpen(false)} className="text-white/80 hover:text-white">
                <ChevronDown size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 text-sm">
              <div className="bg-white p-3 rounded-xl rounded-tl-sm border border-gray-100 shadow-sm max-w-[85%] text-gray-800 leading-relaxed">
                Hi {dbUser?.displayName?.split(" ")[0] || "there"}! I'm your travel assistant. How can I help you plan your next adventure?
              </div>
              
              <div className="space-y-2 mt-4">
                <p className="text-xs text-gray-400 font-medium px-2">Try asking:</p>
                <button className="w-full text-left p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium">
                  "Plan a 3-day trip to Goa under ₹15000"
                </button>
                <button className="w-full text-left p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium">
                  "Suggest restaurants near our hotel"
                </button>
                <button className="w-full text-left p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium">
                  "Optimize this itinerary"
                </button>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask Voyager AI..." 
                  className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ArrowRight(props: any) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
