import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Compass, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Plane, Map, Users } from "lucide-react";
import { auth, googleProvider, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

const DESTINATIONS = [
  { src: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=600", label: "Bali, Indonesia" },
  { src: "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&q=80&w=600", label: "Paris, France" },
  { src: "https://images.unsplash.com/photo-1662107399413-ccaf9bbb1ce9?auto=format&fit=crop&q=80&w=600", label: "Tokyo, Japan" },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const userRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userRef, { displayName: name }, { merge: true });
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Try logging in instead.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* ===== LEFT PANEL — Visual ===== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1400"
          alt="Beautiful travel destination"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-indigo-900/70 to-purple-950/80" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-400/15 rounded-full blur-[80px]" />

        {/* Content */}
        <div className="relative flex flex-col h-full p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white">
              <Compass size={22} />
            </div>
            <span className="font-heading font-bold text-xl text-white">Voyager</span>
          </Link>

          {/* Center headline */}
          <div className="flex-1 flex flex-col items-start justify-center max-w-md">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/70 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              AI-Powered Planning
            </div>
            <h2 className="text-5xl font-bold font-heading text-white leading-tight mb-4">
              Your next great<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                adventure awaits
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-10">
              Join thousands of travelers who plan smarter, travel together, and create memories that last.
            </p>

            {/* Feature pills */}
            <div className="space-y-3">
              {[
                { icon: Plane, label: "AI-generated itineraries in seconds" },
                { icon: Users, label: "Group collaboration with live editing" },
                { icon: Map, label: "Budget tracking for every traveler" },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 bg-indigo-500/30 rounded-lg flex items-center justify-center">
                    <feat.icon size={14} className="text-indigo-300" />
                  </div>
                  <span className="text-white/70 text-sm font-medium">{feat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom destination teasers */}
          <div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-3">Trending destinations</p>
            <div className="flex gap-3">
              {DESTINATIONS.map((d, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden flex-1 h-20 group">
                  <img src={d.src} alt={d.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                    <p className="text-white text-[10px] font-bold">{d.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Form ===== */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAF8F5] dark:bg-[#0D0D1A] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-100/60 dark:bg-indigo-950/30 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-100/60 dark:bg-purple-950/30 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="w-full max-w-[420px] relative">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg">
                <Compass size={20} />
              </div>
              <span className="font-heading font-bold text-xl text-foreground">Voyager</span>
            </Link>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-muted/80 backdrop-blur-sm rounded-2xl p-1 mb-8 border border-border">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isLogin ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Log in
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isLogin ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Create account
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading text-foreground">
              {isLogin ? "Welcome back 👋" : "Join Voyager ✈️"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isLogin
                ? "Sign in to your account to continue planning."
                : "Create your free account and start exploring."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-border rounded-2xl bg-card text-foreground font-bold text-sm hover:bg-muted transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md mb-6 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="px-4 text-xs text-muted-foreground font-medium bg-[#FAF8F5] dark:bg-[#0D0D1A]">or sign in with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock size={16} className="text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-bold text-base hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-xl shadow-indigo-300/30 dark:shadow-indigo-900/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In to Voyager" : "Create My Account"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to Voyager's{" "}
            <a href="#" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Terms</a>{" "}and{" "}
            <a href="#" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
