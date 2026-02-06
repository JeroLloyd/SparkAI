"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

// --- TYPES ---
interface Message {
  role: "user" | "ai";
  content: string;
  id: string;
}

interface PinnedItem {
  id: string;
  content: string;
}

// --- ICONS (Extracted for cleanliness) ---
const Icons = {
  Spark: () => (
    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  ),
  SidebarToggle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Reset: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Bot: () => (
    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
  ),
  Pin: ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  ),
  Export: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
};

export default function Home() {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "I'm ready. Select a template below or describe your goal to start strategizing.", id: "intro" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AUTO-SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- ACTIONS ---
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#+\s/gm, "")
      .replace(/^\s*[\*\-]\s/gm, "- ")
      .replace(/`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/>\s/gm, "");
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(1).map(msg => ({
        role: msg.role === "ai" ? "model" : "user",
        content: msg.content
      }));

      // Use the environment variable, or fallback to localhost for development
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyPayload, message: userMessage.content }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.response, id: Date.now().toString() + "_ai" }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Connection Error.", id: "error" }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const togglePin = (msg: Message) => {
    const isPinned = pinnedItems.some(i => i.id === msg.id);
    if (isPinned) {
      setPinnedItems(prev => prev.filter(i => i.id !== msg.id));
    } else {
      setPinnedItems(prev => [...prev, { id: msg.id, content: msg.content }]);
      if (!isSidebarOpen) setIsSidebarOpen(true);
    }
  };

  const handleUnpin = (id: string) => {
    setPinnedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleExport = () => {
    if (pinnedItems.length === 0) {
      alert("Pin some ideas to the sidebar first!");
      return;
    }
    const text = pinnedItems.map((item, i) => {
      return `STRATEGY BLOCK ${i + 1}\n----------------\n${cleanMarkdown(item.content)}\n`;
    }).join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "My_Viral_Strategy.txt";
    a.click();
  };

  const handleReset = () => {
    if (window.confirm("Start fresh? This clears the chat.")) {
      setMessages([{ role: "ai", content: "Fresh slate. Pick a new direction.", id: "reset" }]);
      setPinnedItems([]);
    }
  };

  // --- RENDER HELPERS ---
  const markdownComponents: Components = {
    // Using simple styling overrides for markdown elements
    strong: (props) => <span className="font-semibold text-teal-400" {...props} />,
    ul: (props) => <ul className="list-disc list-outside ml-4 space-y-1 my-2 opacity-90" {...props} />,
    li: (props) => <li className="pl-1" {...props} />,
    h1: (props) => <h1 className="text-lg font-bold mt-2 mb-2" {...props} />,
    p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans selection:bg-teal-500/30 overflow-hidden relative">
      {/* Scrollbar Styles */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
        .glass { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); }
      `}</style>

      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-teal-900/20 blur-[150px] rounded-full pointer-events-none" />

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative z-10 transition-all duration-300">
        
        {/* HEADER */}
        <header className="h-16 px-6 border-b border-gray-800/50 flex items-center justify-between glass z-20">
          <div className="flex items-center gap-3">
            <Icons.Spark />
            <h1 className="text-lg font-bold tracking-tight text-gray-100">
              SparkAI <span className="text-xs font-normal text-gray-500 ml-2">PRO</span>
            </h1>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all" title="Toggle Sidebar">
               <Icons.SidebarToggle />
            </button>
            <button onClick={handleReset} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-all" title="Reset">
              <Icons.Reset />
            </button>
          </div>
        </header>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500 group`}>
              {msg.role === "ai" && <Icons.Bot />}

              <div className="relative max-w-[85%] sm:max-w-[75%]">
                <div className={`rounded-2xl px-5 py-4 leading-relaxed shadow-md ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-teal-600 to-blue-600 text-white rounded-br-sm"
                    : "bg-gray-900/80 backdrop-blur-sm border border-gray-800 text-gray-200 rounded-bl-sm"
                }`}>
                  <ReactMarkdown components={{
                      ...markdownComponents,
                      strong: (props) => <span className={`font-semibold ${msg.role === 'ai' ? 'text-teal-400' : 'text-white'}`} {...props} />
                  }}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === 'ai' && index !== 0 && (
                   <button 
                     onClick={() => togglePin(msg)}
                     className={`absolute -right-10 top-2 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                       pinnedItems.find(i => i.id === msg.id) ? "text-teal-400 opacity-100" : "text-gray-600 hover:text-teal-400"
                     }`}
                     title="Pin to Strategy Board"
                   >
                     <Icons.Pin active={!!pinnedItems.find(i => i.id === msg.id)} />
                   </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 animate-in fade-in duration-300">
               <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
               </div>
               <div className="bg-gray-900/80 border border-gray-800 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK START TEMPLATES */}
        {messages.length < 3 && !loading && (
          <div className="px-8 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
             {[
               { icon: "🔥", title: "Viral Hooks", sub: "Generate 5 grabby headlines", prompt: "Generate 5 Viral Hooks for my niche" },
               { icon: "📅", title: "Content Plan", sub: "One week of ideas", prompt: "Create a 7-day content calendar for beginners" },
               { icon: "🧐", title: "Strategy Audit", sub: "Find missed opportunities", prompt: "Roast my current content strategy and find gaps" }
             ].map((btn, idx) => (
                <button key={idx} onClick={() => sendMessage(btn.prompt)} className="p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-teal-500/50 rounded-xl text-left transition-all group">
                  <span className="block text-xl mb-1">{btn.icon}</span>
                  <div className="text-sm font-semibold text-gray-200 group-hover:text-teal-400">{btn.title}</div>
                  <div className="text-xs text-gray-500">{btn.sub}</div>
               </button>
             ))}
          </div>
        )}

        {/* INPUT AREA */}
        <div className="p-4 bg-gray-950/80 backdrop-blur-lg border-t border-gray-800 z-20">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2 p-2 bg-gray-900 border border-gray-800 rounded-3xl shadow-xl focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask SparkAI..."
              className="w-full bg-transparent text-gray-200 placeholder:text-gray-500 px-4 py-3 outline-none resize-none max-h-32 min-h-[50px]"
              rows={1}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="mb-1 p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-full transition-all disabled:opacity-50 disabled:bg-gray-700 shadow-lg hover:shadow-teal-500/20 active:scale-95"
            >
              <Icons.Send />
            </button>
          </div>
        </div>
      </div>

      {/* --- STRATEGY SIDEBAR --- */}
      <div className={`${isSidebarOpen ? "w-80" : "w-0"} transition-all duration-300 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md">
           <h2 className="font-bold text-gray-200 text-sm tracking-wide uppercase">Strategy Board</h2>
           <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{pinnedItems.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pinnedItems.length === 0 ? (
            <div className="text-center mt-10 text-gray-600">
               <div className="text-3xl mb-2">📌</div>
               <p className="text-sm">No ideas pinned yet.</p>
               <p className="text-xs">Hover over an AI answer to pin it.</p>
            </div>
          ) : (
             pinnedItems.map(item => (
                <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm relative group hover:border-teal-500/30 transition-all">
                   <button 
                    onClick={() => handleUnpin(item.id)} 
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                   >
                     ✕
                   </button>
                   <div className="line-clamp-6 text-gray-300">
                      <ReactMarkdown allowedElements={['p', 'strong', 'ul', 'li']}>{item.content}</ReactMarkdown>
                   </div>
                </div>
             ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
           <button 
             onClick={handleExport}
             className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-center gap-2 font-medium text-sm"
           >
              <Icons.Export />
              Export Clean Text (.txt)
           </button>
        </div>
      </div>
    </div>
  );
}