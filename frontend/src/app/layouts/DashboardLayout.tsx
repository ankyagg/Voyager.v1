import { Compass, Home, MapPin, Wallet, Settings, User, Bell, Map, Moon, Sun } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { useAuth } from "../contexts/AuthContext";
import AIAssistantSidebar from "../components/AIAssistantSidebar";

export default function DashboardLayout() {
  const location = useLocation();
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
        <AIAssistantSidebar />
      </main>
    </div>
  );
}
