"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseConfig } from "@/lib/supabase/config";

const codeModels = [
  { label: "GLM 4.7 Flash", model: "glm-4.7-flash" },
  { label: "Qwen 3.5", model: "qwen3.5" },
];

export default function KeyCenterPanel() {
  const [activeAccess, setActiveAccess] = useState<string[]>([]);
  const [selectedModelsForRedeem, setSelectedModelsForRedeem] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");

  const supabaseReady = Boolean(getSupabaseConfig());

  const loadAccess = useCallback(async () => {
    if (!supabaseReady) return;
    try {
      const res = await fetch("/api/keys/access");
      if (res.ok) {
          const data = await res.json();
          setActiveAccess(data.map((a: any) => a.model_name));
      }
    } catch (err) {
      console.error("Failed to load access", err);
    }
  }, [supabaseReady]);

  useEffect(() => { 
    loadAccess(); 
    window.addEventListener("user-access-updated", loadAccess);
    return () => window.removeEventListener("user-access-updated", loadAccess);
  }, [loadAccess]);

  const toggleModelSelection = (modelId: string) => {
    if (!activeAccess.includes(modelId)) return;
    
    setSelectedModelsForRedeem(prev => 
      prev.includes(modelId) 
        ? prev.filter(m => m !== modelId) 
        : [...prev, modelId]
    );
  };

  const redeemApiKey = async () => {
    if (selectedModelsForRedeem.length === 0) { setNotice("Select models to bundle."); return; }

    setRedeeming(true);
    setNewApiKey("");
    try {
      const response = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          models: selectedModelsForRedeem,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewApiKey(data.key);
        setNotice("Gateway key issued successfully.");
        window.dispatchEvent(new Event("gateway-keys-updated"));
      } else {
        setNotice(data.error || "Redemption failed.");
      }
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
           <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Step 1</span>
              <h3 className="text-xl font-bold text-white mt-1">Bundle Active Models</h3>
              <p className="text-sm text-slate-500 mt-1">Select from your unlocked modules to create a bundle key.</p>
           </div>
           <button 
             onClick={loadAccess}
             className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
             title="Refresh Access"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
           </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-10">
          {codeModels.map((item) => {
            const isUnlocked = activeAccess.includes(item.model);
            const isChecked = selectedModelsForRedeem.includes(item.model);
            return (
              <div 
                key={item.model} 
                onClick={() => toggleModelSelection(item.model)}
                className={`group flex items-center justify-between rounded-2xl border p-4 transition-all ${
                  isUnlocked 
                    ? "cursor-pointer border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]" 
                    : "opacity-30 grayscale cursor-not-allowed border-white/5 bg-black/20"
                } ${isChecked ? "!border-cyan-500/50 !bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all ${
                    isChecked ? "bg-cyan-500 border-cyan-500" : "bg-black/40 border-white/10"
                  }`}>
                    {isChecked && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span className={`text-sm font-bold transition-colors ${isChecked ? "text-white" : isUnlocked ? "text-slate-300" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                </div>
                {isUnlocked ? (
                   <div className={`h-1.5 w-1.5 rounded-full transition-all ${isChecked ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-125" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"}`} />
                ) : (
                   <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Locked</span>
                )}
              </div>
            );
          })}
        </div>

        {activeAccess.length === 0 && (
           <div className="mb-10 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">No models activated</p>
              <p className="text-[10px] text-amber-200/60 mt-1">Use the "Unlock AI Modules" panel to redeem a license key first.</p>
           </div>
        )}

        <button onClick={redeemApiKey} disabled={redeeming} className="group relative w-full overflow-hidden rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-50">
           {redeeming ? "Processing..." : "Generate Gateway Access Key"}
        </button>

        {newApiKey && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 animate-in zoom-in-95">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">New Access Key Issued</p>
             <code className="block break-all font-mono text-sm font-bold text-white mb-4">{newApiKey}</code>
             <button onClick={() => { navigator.clipboard.writeText(newApiKey); setNotice("Copied to clipboard!"); }} className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 hover:text-white transition">Copy Key</button>
          </div>
        )}
        
        {notice && <p className="mt-4 text-center text-[10px] font-bold text-cyan-400 uppercase tracking-tighter">{notice}</p>}
    </div>
  );
}
