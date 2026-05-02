"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { useEffect, useState, useRef, KeyboardEvent } from "react";

const modelLabels: Record<string, string> = {
  "glm-4.7-flash": "GLM 4.7 Flash",
  "qwen3.5": "Qwen 3.5",
};

const availableModelOptions = [
  { id: "glm-4.7-flash", label: "GLM 4.7 Flash" },
  { id: "qwen3.5", label: "Qwen 3.5" },
];

export default function CodeAssistantPage() {
  const [activatedModels, setActivatedModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabaseReady = Boolean(getSupabaseConfig());

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
    }
  }, [input]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let active = true;
    const loadActivatedModels = async () => {
      if (!supabaseReady) {
        setNotice("Supabase configuration missing.");
        return;
      }
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!active || !userData.user) return;

      const { data, error } = await supabase
        .from("user_keys")
        .select("key_name")
        .eq("user_id", userData.user.id)
        .is("revoked_at", null);

      if (!active) return;
      if (error) {
        setNotice("Error loading keys.");
        return;
      }

      const activeNames = (data ?? []).map(r => r.key_name);
      setActivatedModels(activeNames);

      if (activeNames.length > 0) {
        setSelectedModel(curr => activeNames.includes(curr) ? curr : activeNames[0]);
        setNotice(`Ready. ${activeNames.length} model(s) activated.`);
      } else {
        setNotice("No models activated. Go to Key Center first.");
      }
      
      const sKey = `matcha-hub:chat-v2:${userData.user.id}`;
      setStorageKey(sKey);
      const saved = window.localStorage.getItem(sKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        } catch { /* ignore */ }
      }
    };
    loadActivatedModels();
    return () => { active = false; };
  }, [supabaseReady]);

  useEffect(() => {
    if (storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify({ messages }));
    }
  }, [messages, storageKey]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !selectedModel) return;

    setSending(true);
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, mode: "agent", prompt: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Failed to reach AI"}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0f14]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0d0f14] shrink-0">
         <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">AI Chat</h2>
            {notice && <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{notice}</span>}
         </div>
         <button onClick={() => setMessages([])} className="text-xs font-bold text-slate-500 hover:text-rose-400 transition">
            Clear Chat
         </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#0d0f14]">
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
               <div className="mx-auto h-16 w-16 mb-6 transition-all animate-in fade-in zoom-in-95 duration-700">
                  <img src="/StartNow_logo.png" alt="StartNow Logo" className="h-full w-full object-contain" />
               </div>
               <h1 className="text-xl font-bold text-slate-400">Start a conversation</h1>
               <p className="text-sm text-slate-600 mt-2">Messages are encrypted and stored locally.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user" 
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100" 
                  : "bg-white/5 border border-white/5 text-slate-200"
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
              <span className="mt-1 text-[9px] font-bold text-slate-600 uppercase tracking-tighter mx-2">
                {m.role === "user" ? "You" : (modelLabels[selectedModel] || selectedModel)}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Deck */}
      <div className="p-6 bg-[#0d0f14] border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full min-h-[56px] max-h-48 resize-none rounded-2xl border border-white/10 bg-white/[0.02] pl-4 pr-32 py-4 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-all"
            />
            
            <div className="absolute right-3 bottom-2.5 flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
               <select
                 value={selectedModel}
                 onChange={(e) => setSelectedModel(e.target.value)}
                 className="h-9 px-3 rounded-xl bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-wider focus:text-white outline-none cursor-pointer hover:bg-white/5 transition-colors"
               >
                 {availableModelOptions.map(opt => (
                   <option key={opt.id} value={opt.id} disabled={!activatedModels.includes(opt.id)} className="bg-[#111318] text-slate-200">
                     {opt.label} {!activatedModels.includes(opt.id) ? "🔒" : ""}
                   </option>
                 ))}
                 {activatedModels.length === 0 && <option value="" className="bg-[#111318]">No Active Keys</option>}
               </select>

               <div className="w-[1px] h-4 bg-white/10 mx-1" />

               <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim() || !selectedModel}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black hover:bg-cyan-400 transition-all disabled:opacity-20 disabled:hover:bg-white"
               >
                  {sending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                  )}
               </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Matcha Node Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
