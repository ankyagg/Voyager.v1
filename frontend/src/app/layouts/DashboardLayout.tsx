import { Compass, LayoutDashboard, MapPin, Wallet, Settings, Bell, Map, Moon, Sun, LogOut, ChevronRight } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { useAuth } from "../contexts/AuthContext";
import AIAssistantSidebar from "../components/AIAssistantSidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { dbUser } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "My Trips", path: "/dashboard", exact: true, color: "from-indigo-500 to-purple-500" },
    { icon: Map, label: "Discover", path: "/dashboard/saved", exact: false, color: "from-teal-500 to-cyan-500" },
    { icon: Wallet, label: "Budget", path: "/dashboard/budget", exact: false, color: "from-amber-500 to-orange-500" },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "E";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* ===== SIDEBAR ===== */}
      <aside className="w-[240px] bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex shrink-0 relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/20 dark:via-transparent pointer-events-none" />
        
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 shrink-0 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
            <Compass size={20} />
          </div>
          <span className="font-heading font-bold text-lg text-foreground tracking-tight">
            Voya<span className="text-indigo-600 dark:text-indigo-400">ger</span>
          </span>
        </div>

        {/* Nav section */}
        <div className="px-3 py-2 relative flex-1 flex flex-col">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3 px-3">Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative ${
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    active
                      ? `bg-gradient-to-br ${item.color} text-white shadow-sm`
                      : "bg-accent text-muted-foreground group-hover:text-foreground"
                  }`}>
                    <item.icon size={15} />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                  {active && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Separator */}
          <div className="border-t border-sidebar-border my-4" />

          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3 px-3">Settings</p>
          <nav>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-muted-foreground hover:bg-accent hover:text-foreground group"
            >
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Settings size={15} />
              </div>
              <span className="font-semibold">Settings</span>
            </Link>
          </nav>

          {/* AI Promo Card */}
          <div className="mt-auto mb-2 mx-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <p className="text-xs font-bold mb-1">✨ Voyager AI</p>
              <p className="text-white/70 text-xs leading-relaxed">Ask AI to plan your next adventure</p>
            </div>
          </div>
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border shrink-0 bg-sidebar">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-accent transition-all cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              {getInitials(dbUser?.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{dbUser?.displayName || "Explorer"}</p>
              <p className="text-xs text-muted-foreground truncate">{dbUser?.email || ""}</p>
            </div>
            <LogOut size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar actions */}
        <div className="absolute top-0 right-0 p-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-card border border-transparent hover:border-border transition-all shadow-sm"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-card border border-transparent hover:border-border transition-all shadow-sm relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          <Outlet />
        </div>

        {/* Floating AI Widget */}
        <AIAssistantSidebar />
      </main>
    </div>
  );
}
