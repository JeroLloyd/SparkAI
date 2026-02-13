"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

// --- TYPES ---
interface Message {
  role: "user" | "ai";
  content: string;
  id: string;
}

interface PinnedItem {
  id: string;
  content: string;
  category: "preference" | "medical" | "goal";
}

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  restrictions: string;
}

// --- MAIN COMPONENT ---
export default function NutribotInterface() {
  // STATE: Data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // STATE: UI
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [selectedPin, setSelectedPin] = useState<PinnedItem | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // --- ACTIONS ---

  const handlePinMessage = (content: string, category: "preference" | "goal") => {
    const newItem: PinnedItem = {
      id: Date.now().toString(),
      content: content,
      category
    };
    setPinnedItems(prev => [...prev, newItem]);
  };

  const removePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setPinnedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleExportContext = () => {
    if (pinnedItems.length === 0) return;
    const textContent = pinnedItems
      .map(p => `[${p.category.toUpperCase()}] ${new Date(Number(p.id)).toLocaleDateString()}\n${p.content}`)
      .join("\n\n-----------------------------------\n\n");
    
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nutribot_context.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([{ 
        role: "ai", 
        content: `**History Cleared.**\n\nI am ready.`, 
        id: Date.now().toString() 
      }]);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newProfile = {
      name: fd.get("name") as string,
      age: Number(fd.get("age")),
      gender: fd.get("gender") as string,
      height: Number(fd.get("height")),
      weight: Number(fd.get("weight")),
      activityLevel: fd.get("activityLevel") as string,
      goal: fd.get("goal") as string,
      restrictions: (fd.get("restrictions") as string) || "None",
    };
    
    setProfile(newProfile);
    setShowProfileForm(false);

    // If messages exist, just add a system note instead of resetting
    if (messages.length > 0) {
        setMessages(prev => [...prev, {
            role: "ai",
            content: `**System Notice:** User profile updated. New goal: ${newProfile.goal}. Restrictions: ${newProfile.restrictions}.`,
            id: Date.now().toString()
        }]);
    } else {
        setMessages([{ role: "ai", content: `**System Ready.**\n\nProfile loaded for ${newProfile.name}. Goal: ${newProfile.goal}.`, id: "init" }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !profile) return;

    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userText, id: Date.now().toString() }]);
    setIsProcessing(true);

    try {
      const historyPayload = messages.filter(m => m.id !== "init").map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          profile: profile,           
          pinned_context: pinnedItems 
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", content: data.response, id: Date.now().toString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "⚠️ **System Error**: Backend unreachable.", id: "err" }]);
    }
    setIsProcessing(false);
  };

  // --- RENDERERS ---

  if (showProfileForm) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b] text-white p-4">
        <form 
          onSubmit={handleProfileSubmit} 
          suppressHydrationWarning
          className="bg-[#18181b] p-8 rounded-2xl border border-white/10 w-full max-w-md space-y-4 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Nutribot Profile</h1>
              {profile && <button type="button" onClick={() => setShowProfileForm(false)} className="text-gray-500 hover:text-white text-sm">Cancel</button>}
          </div>
          
          <input name="name" defaultValue={profile?.name} placeholder="Name" required suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input name="age" defaultValue={profile?.age} type="number" placeholder="Age" required suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm" />
            <input name="weight" defaultValue={profile?.weight} type="number" placeholder="Weight (kg)" required suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="height" defaultValue={profile?.height} type="number" placeholder="Height (cm)" required suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm" />
            <select name="gender" defaultValue={profile?.gender} suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm">
              <option>Male</option><option>Female</option>
            </select>
          </div>
          <select name="activityLevel" defaultValue={profile?.activityLevel} suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm">
            <option value="Sedentary">Sedentary</option>
            <option value="Lightly Active">Lightly Active</option>
            <option value="Moderately Active">Moderately Active</option>
            <option value="Very Active">Very Active</option>
          </select>
          <select name="goal" defaultValue={profile?.goal} suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm">
            <option value="Weight Loss">Weight Loss</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Muscle Gain">Muscle Gain</option>
          </select>
          <input name="restrictions" defaultValue={profile?.restrictions} placeholder="Dietary Restrictions (e.g. No Beef)" suppressHydrationWarning className="w-full bg-[#27272a] p-3 rounded text-sm" />
          <button type="submit" className="w-full bg-orange-600 p-3 rounded font-bold hover:bg-orange-500 transition">Save Profile</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-gray-200 overflow-hidden font-[family-name:var(--font-sans)]">
      
      {/* SIDEBAR */}
      <div className="w-72 border-r border-white/5 bg-[#0c0c0e] p-4 flex flex-col hidden md:flex">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Profile</h2>
              <button onClick={() => setShowProfileForm(true)} className="text-[10px] text-orange-400 hover:text-orange-300">EDIT</button>
          </div>
          <div className="bg-[#18181b] p-3 rounded-lg text-sm space-y-2 border border-white/5 shadow-inner">
            <div className="flex justify-between"><span>Weight</span> <span className="text-white">{profile?.weight}kg</span></div>
            <div className="flex justify-between"><span>Goal</span> <span className="text-orange-500">{profile?.goal}</span></div>
            <div className="flex justify-between"><span>Restrictions</span> <span className="text-red-400 text-xs text-right max-w-[100px] truncate">{profile?.restrictions}</span></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pinned Context</h2>
             {pinnedItems.length > 0 && (
               <button onClick={handleExportContext} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-orange-400 transition" title="Save to Desktop">⬇ Save</button>
             )}
          </div>
          
          {pinnedItems.length === 0 ? (
            <p className="text-xs text-gray-600 italic text-center mt-10">Pin messages to save them.</p>
          ) : (
            <div className="space-y-2">
              {pinnedItems.map(item => (
                <div key={item.id} onClick={() => setSelectedPin(item)} className="group relative bg-[#18181b] p-3 rounded-lg border border-l-2 border-l-orange-500 border-white/5 hover:bg-[#27272a] cursor-pointer transition">
                  <p className="text-xs text-gray-300 line-clamp-3 select-none">{item.content}</p>
                  <button onClick={(e) => removePin(e, item.id)} className="absolute top-1 right-1 text-gray-600 hover:text-red-500 hidden group-hover:block p-1">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#09090b]/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">NB</div>
            <span className="font-semibold text-white">Nutribot System</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowProfileForm(true)} className="text-xs text-gray-500 hover:text-white sm:hidden">Edit Profile</button>
             <button onClick={handleClearHistory} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition">
                <span className="text-lg">🗑</span> <span className="hidden sm:inline">Clear Chat</span>
             </button>
             <div className="h-4 w-[1px] bg-white/10"></div>
             <SignedOut><SignInButton mode="modal"><button className="text-sm font-medium text-neutral-400 hover:text-white">Sign In</button></SignInButton></SignedOut>
             <SignedIn><UserButton /></SignedIn>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[800px] rounded-2xl px-6 py-4 text-sm leading-relaxed border shadow-lg ${msg.role === "user" ? "bg-orange-900/20 border-orange-500/30 text-orange-100" : "bg-[#18181b] border-white/10 shadow-black/40"}`}>
                <ReactMarkdown components={{
                  strong: ({node, ...props}) => <span className="font-semibold text-orange-300" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-md font-bold text-white mt-4 mb-2 border-b border-white/5 pb-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                }}>{msg.content}</ReactMarkdown>
                {msg.role === "ai" && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                     <button onClick={() => handlePinMessage(msg.content, "preference")} className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition">📌 Pin to Context</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && <div className="flex justify-start animate-pulse"><div className="bg-[#18181b] border border-white/10 px-4 py-2 rounded-full text-xs text-gray-400 flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>Processing...</div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/5 bg-[#09090b]">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ask about meal plans, macros, or recipes..." className="flex-1 bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500/50 outline-none transition shadow-inner placeholder:text-gray-600" />
            <button onClick={sendMessage} disabled={isProcessing} className="bg-orange-600 px-6 rounded-xl font-bold text-white hover:bg-orange-500 transition disabled:opacity-50 shadow-lg">Send</button>
          </div>
        </div>

        {selectedPin && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-white/10 flex justify-between items-center"><span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{selectedPin.category} Context</span><button onClick={() => setSelectedPin(null)} className="text-gray-400 hover:text-white">Close</button></div>
              <div className="p-6 overflow-y-auto text-sm leading-relaxed text-gray-300"><ReactMarkdown>{selectedPin.content}</ReactMarkdown></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}