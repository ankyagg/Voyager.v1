import { useState } from "react";
import { Sparkles, Send, Bot, User, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  suggestion?: any;
}

export default function AIAssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hello! I'm your Voyager AI. I can help you find destinations, draft an itinerary, or manage your budget. What's on your mind?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Connect to real backend API
    try {
      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, context: { tripId: "mock-trip-id" } }),
      });
      const data = await response.json();
      
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: "ai",
        content: data.reply || "I'm having trouble processing that right now.",
      };
      setMessages((prev: Message[]) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "ai",
        content: "Sorry, I can't reach the AI Engine right now. Make sure the backend and AI-engine are running!",
      };
      setMessages((prev: Message[]) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />}
        {!isOpen && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
            AI
          </span>
        )}
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-40 flex flex-col border-l border-gray-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900">Voyager AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Assistant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                    msg.role === "ai" ? "bg-blue-100 text-blue-600" : "bg-indigo-600 text-white"
                  }`}>
                    {msg.role === "ai" ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === "ai" 
                      ? "bg-white border border-gray-100 shadow-sm rounded-tl-none text-gray-800" 
                      : "bg-indigo-600 text-white rounded-tr-none shadow-md"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.role === "ai" && !isLoading && msg.id !== "1" && (
                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                          <Check size={14} /> Apply Change
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                          <RotateCcw size={14} /> Replan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 shrink-0 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask Voyager to plan..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-4 pr-14 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none min-h-[60px] max-h-[120px]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-3 font-medium uppercase tracking-widest">
                Supported by GPT-4o Agentic Engine
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
