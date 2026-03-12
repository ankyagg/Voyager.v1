import { useState, useContext } from "react";
import { Send, Bot, User, RotateCcw, Check, X, Loader2, Sparkles, Zap, Map, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { chatWithAI } from "@/lib/aiApi";
import { ItineraryContext } from "../contexts/ItineraryContext";
import { useTrips } from "../contexts/TripContext";
import { useParams } from "react-router";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

const QUICK_PROMPTS = [
  { icon: Zap, label: "Plan Day 1", prompt: "Plan a perfect Day 1 itinerary for my Bali trip, including morning, afternoon and evening activities." },
  { icon: Map, label: "Top 5 spots", prompt: "What are the top 5 must-visit places in Bali for a first-timer?" },
  { icon: Calendar, label: "3-day plan", prompt: "Create a 3-day itinerary for Ubud, Bali with cultural experiences and nature." },
];

export default function AIAssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const itineraryCtx = useContext(ItineraryContext);
  const { tripId } = useParams<{ tripId?: string }>();
  const { trips } = useTrips();
  const currentTrip = trips.find(t => t.id === tripId) ?? null;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi! I'm your Voyager AI travel planner. I can draft itineraries, suggest destinations, estimate budgets, and make your trip unforgettable. What shall we plan? ✈️",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await chatWithAI({
        message: text,
        context: {
          tripId: currentTrip?.id || "",
          destination: currentTrip?.location || "",
          travelers: String((currentTrip?.participantIds?.length || 0) + 1),
          budget: currentTrip?.budget ? `₹${currentTrip.budget}` : "",
          savedPlaces: currentTrip?.savedPlaces ?? [],
        }
      });
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: "ai",
        content: data.reply || "I'm having trouble processing that right now.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "ai",
        content: "I can't reach the AI engine right now. Make sure the backend is running!",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ===== FAB Button ===== */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-7 right-7 w-16 h-16 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 text-white rounded-2xl shadow-2xl shadow-indigo-400/40 flex items-center justify-center z-[70] group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Sparkles size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulsing ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50 animate-ping" />
        )}
        {/* AI badge */}
        {!isOpen && (
          <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-md">
            AI
          </span>
        )}
      </motion.button>

      {/* ===== Sidebar Panel ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-card dark:bg-card shadow-[-20px_0_60px_rgba(0,0,0,0.12)] z-[60] flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                    <Bot size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white">Voyager AI</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Ollama llama3 · Active</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="p-4 bg-muted/30 border-b border-border shrink-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qp.prompt)}
                      className="flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-2xl text-center hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group"
                    >
                      <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/60 transition-colors">
                        <qp.icon size={13} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground leading-tight">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                    msg.role === "ai"
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                      : "bg-gradient-to-br from-gray-600 to-gray-700 text-white"
                  }`}>
                    {msg.role === "ai" ? <Bot size={15} /> : <User size={15} />}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "ai"
                        ? "bg-muted/50 border border-border text-foreground rounded-tl-md [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&_strong]:font-bold"
                        : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-md shadow-md"
                    }`}>
                      {msg.role === "ai" ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "ai" && !isLoading && msg.id !== "1" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (itineraryCtx) {
                              itineraryCtx.applyFromMarkdown(msg.content);
                              setIsOpen(false);
                            }
                          }}
                          className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <Check size={12} /> Apply
                        </button>
                        <button
                          onClick={() => handleSend("Replan with different activities.")} 
                          className="flex items-center gap-1.5 bg-muted border border-border text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <RotateCcw size={12} /> Replan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0 flex items-center justify-center">
                    <Loader2 size={15} className="animate-spin" />
                  </div>
                  <div className="bg-muted/50 border border-border p-4 rounded-2xl rounded-tl-md">
                    <div className="flex gap-1.5 items-center">
                      {[0, 200, 400].map((delay, i) => (
                        <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2 font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask Voyager to plan your adventure..."
                  className="w-full bg-muted/50 border border-border rounded-2xl py-4 pl-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none resize-none transition-all min-h-[64px] max-h-[120px]"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 p-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2.5 font-semibold uppercase tracking-widest">
                Powered by Ollama Agentic Engine
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
