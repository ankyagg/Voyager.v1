import { ArrowRight, Compass, Map, Users, Plane, Star, Zap, Globe, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrollY * 0.4}px)`;
        heroRef.current.style.opacity = `${1 - scrollY * 0.002}`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Zap,
      gradient: "from-indigo-500 to-purple-600",
      title: "AI Itinerary Engine",
      desc: "GPT-4o powered assistant drafts your perfect day-by-day plan in seconds, tailored to your style and budget.",
      badge: "Most loved"
    },
    {
      icon: Users,
      gradient: "from-pink-500 to-rose-500",
      title: "Real-Time Collaboration",
      desc: "Vote on activities, chat with your group, and edit itineraries together — all synced live.",
      badge: null
    },
    {
      icon: Globe,
      gradient: "from-teal-400 to-cyan-500",
      title: "Destination Discovery",
      desc: "Curated places powered by real traveler reviews. Save to your trip with one tap.",
      badge: null
    },
    {
      icon: Map,
      gradient: "from-amber-400 to-orange-500",
      title: "Smart Budget Tracking",
      desc: "Split costs, track spending, and keep every traveler aligned on finances in real-time.",
      badge: null
    }
  ];

  const stats = [
    { value: "50k+", label: "Trips planned" },
    { value: "200+", label: "Countries covered" },
    { value: "4.9★", label: "Average rating" },
    { value: "98%", label: "Traveler satisfaction" },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Frequent traveler, Mumbai",
      avatar: "PS",
      avatarBg: "from-violet-400 to-indigo-500",
      text: "Voyager AI planned our Bali trip better than any travel agent. It knew exactly when to schedule sunsets!"
    },
    {
      name: "James Chen",
      role: "Group trip organizer, Singapore",
      avatar: "JC",
      avatarBg: "from-teal-400 to-cyan-500",
      text: "Planning a 12-person Japan trip used to be a nightmare. Voyager turned it into a fun, collaborative experience."
    },
    {
      name: "Sofia Martinez",
      role: "Backpacker, Spain",
      avatar: "SM",
      avatarBg: "from-rose-400 to-pink-500",
      text: "The budget tracker is a lifesaver. Everyone knows what they owe and there are zero awkward money conversations."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-gray-900 font-sans flex flex-col overflow-hidden">
      
      {/* ===== NAVBAR ===== */}
      <header className="px-6 lg:px-10 py-5 flex justify-between items-center bg-white/60 backdrop-blur-xl sticky top-0 z-50 border-b border-black/5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Compass size={20} />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-gray-900">
            Voya<span className="text-indigo-600">ger</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
          <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Stories</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50">
            Log in
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/60 hover:shadow-indigo-300/60 hover:-translate-y-0.5 flex items-center gap-2"
          >
            Get Started <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        
        {/* ===== HERO ===== */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900">
            <div ref={heroRef} className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=2000"
                alt="Aerial view of a tropical destination"
                className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
              />
            </div>
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-900/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
            {/* Floating orbs */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full">
            <div className="max-w-3xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                AI-Powered Travel Planning · Now Live
              </div>

              <h1 className="text-5xl md:text-7xl font-bold font-heading text-white leading-[1.08] mb-6">
                Travel is better<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                  planned together.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mb-10">
                Voyager is the AI-powered workspace for collaborative travel. Draft itineraries, discover
                destinations, track budgets — all in one beautiful space, shared with your crew.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  to="/dashboard"
                  className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-bold text-base hover:bg-indigo-50 transition-all shadow-2xl shadow-black/20 hover:-translate-y-1 flex items-center gap-3 group"
                >
                  Plan My First Trip
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/20 transition-all flex items-center gap-3"
                >
                  See how it works
                  <ChevronDown size={18} />
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["from-violet-400 to-indigo-500", "from-teal-400 to-cyan-500", "from-rose-400 to-pink-500", "from-amber-400 to-orange-500"].map((grad, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} border-2 border-indigo-900 flex items-center justify-center text-white text-xs font-bold`}>
                      {["P", "J", "S", "M"][i]}
                    </div>
                  ))}
                </div>
                <div className="text-white/60 text-sm">
                  <span className="text-white font-bold">12,000+</span> trips planned this month
                </div>
              </div>
            </div>
          </div>

          {/* Floating trip card */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden xl:block animate-float">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 w-72 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1724568834522-81eb8e5c048c?auto=format&fit=crop&q=80&w=500"
                alt="Bali"
                className="w-full h-40 object-cover rounded-2xl mb-4"
              />
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-bold">Bali Retreat 2026</p>
                    <p className="text-white/60 text-xs mt-0.5">Oct 12–20 · 4 travelers</p>
                  </div>
                  <span className="bg-green-500/20 text-green-300 text-xs font-bold px-2 py-1 rounded-full border border-green-500/30">Live</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                </div>
                <p className="text-white/50 text-xs">$4,500 of $6,000 budget used</p>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                  <div className="w-5 h-5 bg-indigo-400 rounded flex items-center justify-center">
                    <Zap size={11} className="text-white" />
                  </div>
                  <p className="text-white/70 text-xs">AI updated Day 3 itinerary</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS BAR ===== */}
        <section className="bg-indigo-600 py-10 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold font-heading text-white">{stat.value}</p>
                <p className="text-indigo-200 text-sm mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="py-28 px-6 lg:px-10 bg-[#FAF8F5]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full">
                Built for Modern Travelers
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mt-6 mb-4">
                Everything your group trip<br />needs, in one place
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                No more spreadsheets, scattered WhatsApp messages, or confused itineraries. Voyager unifies your entire travel planning workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative">
                    {feature.badge && (
                      <span className="absolute -top-1 right-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {feature.badge}
                      </span>
                    )}
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <feature.icon size={26} className="text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-2xl text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-base">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="py-28 px-6 lg:px-10 bg-gradient-to-br from-indigo-950 to-purple-950 texture-noise">
          <div className="max-w-5xl mx-auto text-center">
            <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              How Voyager Works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mt-6 mb-20">
              From idea to itinerary<br />in 3 simple steps
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Create your trip", desc: "Add your destination, dates, and invite your travel partners to join the workspace.", color: "from-indigo-400 to-violet-400" },
                { step: "02", title: "Plan with AI", desc: "Tell Voyager your preferences and let the AI generate a personalized, day-by-day itinerary instantly.", color: "from-teal-400 to-cyan-400" },
                { step: "03", title: "Go explore!", desc: "Collaborate, vote, adjust, and finalize. Walk out the door with a perfect trip everyone loves.", color: "from-pink-400 to-rose-400" }
              ].map((step, i) => (
                <div key={i} className="relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 z-10">
                      <ArrowRight size={24} className="text-white/20" />
                    </div>
                  )}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all">
                    <div className={`text-5xl font-bold font-heading bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-6`}>
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold font-heading text-white mb-3">{step.title}</h3>
                    <p className="text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section id="testimonials" className="py-28 px-6 lg:px-10 bg-[#FAF8F5]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full">
                Traveler Stories
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mt-6">
                Loved by thousands of<br />adventurers worldwide
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-500 hover:-translate-y-1">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-8 text-base italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white font-bold text-sm`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-gray-400 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-16 relative overflow-hidden shadow-2xl shadow-indigo-300/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4">
                Your next adventure<br />starts here.
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto">
                Create your free workspace, invite your friends, and let Voyager AI handle the heavy lifting.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-3 bg-white text-indigo-700 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-2xl hover:-translate-y-1 group"
              >
                <Plane size={22} />
                Start Planning Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-950 text-white py-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                  <Compass size={20} className="text-white" />
                </div>
                <span className="font-heading font-bold text-xl text-white">Voyager</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">The AI-powered travel planning platform for modern explorers and groups.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm text-gray-400">
              <div className="space-y-3">
                <p className="text-white font-semibold">Product</p>
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#" className="block hover:text-white transition-colors">Pricing</a>
                <a href="#" className="block hover:text-white transition-colors">Changelog</a>
              </div>
              <div className="space-y-3">
                <p className="text-white font-semibold">Company</p>
                <a href="#" className="block hover:text-white transition-colors">About</a>
                <a href="#" className="block hover:text-white transition-colors">Blog</a>
                <a href="#" className="block hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2026 Voyager Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
