import { ArrowRight, Compass, Map, Users, Plane, Star } from "lucide-react";
import { Link } from "react-router";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0] text-gray-900 font-sans flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Compass size={20} />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-blue-900">
            Voyager
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
          <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-8 py-20 md:py-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold font-heading text-gray-900 leading-[1.1]">
              Plan trips together, <span className="text-blue-600">effortlessly</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
              Voyager is a collaborative travel planning platform powered by AI. Organize itineraries, track budgets, and discover destinations with your friends in one beautiful workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Create a Trip <ArrowRight size={20} />
              </Link>
              <Link
                to="#demo"
                className="bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-medium text-lg hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto justify-center flex items-center gap-2"
              >
                Explore Demo
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-blue-100 rounded-[2.5rem] rotate-3 scale-105 -z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1576442393232-6b3081e02e89?auto=format&fit=crop&q=80&w=1080"
              alt="Beautiful travel landscape ocean"
              className="rounded-[2.5rem] shadow-2xl object-cover h-[500px] w-full"
            />
            {/* Floating Elements */}
            <div className="absolute top-8 -left-8 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Alex joined</p>
                <p className="text-sm font-bold text-gray-900">Bali 2026 Trip</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Everything you need for the perfect trip</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Stop using spreadsheets and scattered chat messages. Voyager brings all your travel planning into one structured, beautiful workspace.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Star, title: "AI Itinerary Generator", desc: "Let our AI assistant draft the perfect day-by-day plan based on your preferences." },
                { icon: Users, title: "Collaborative Planning", desc: "Invite friends, vote on activities, and edit the itinerary together in real-time." },
                { icon: Map, title: "Destination Discovery", desc: "Save places you want to visit and organize them beautifully on an interactive map." },
                { icon: Plane, title: "Budget Tracking", desc: "Keep everyone on the same page with shared expenses and individual budget limits." }
              ].map((feature, i) => (
                <div key={i} className="bg-[#F8F5F0]/50 p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Compass size={24} className="text-blue-400" />
            <span className="font-heading font-bold text-xl">Voyager</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-500">© 2026 Voyager Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
