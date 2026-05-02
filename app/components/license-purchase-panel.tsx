"use client";

import { useState } from "react";

const availableModels = [
  { id: "glm-4.7-flash", label: "GLM 4.7 Flash", basePrice: 1000 },
  { id: "qwen3.5", label: "Qwen 3.5", basePrice: 1500 },
];

export default function LicensePurchasePanel() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [newLicenseCode, setNewLicenseCode] = useState("");
  const [status, setStatus] = useState("");

  const toggleModel = (id: string) => {
    setSelectedModels(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const buyLicense = async () => {
    if (selectedModels.length === 0) return setStatus("Select at least one AI model.");
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/keys/license/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: selectedModels, days }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewLicenseCode(data.key_value);
        setSelectedModels([]);
        setStatus("Purchase complete! Activate your code below.");
      } else {
        setStatus(data.error || "Transaction failed.");
      }
    } catch (err) {
      setStatus("Error connecting to marketplace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl">
      <div className="mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Hub Marketplace</span>
        <h3 className="text-xl font-bold text-white mt-1">Get AI Access Code</h3>
        <p className="text-sm text-slate-500 mt-1">Choose your models and duration. You can use this code yourself or share it.</p>
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {availableModels.map(m => (
          <div 
            key={m.id} 
            onClick={() => toggleModel(m.id)}
            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedModels.includes(m.id) 
                ? 'border-cyan-500/50 bg-cyan-500/10' 
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center gap-3">
               <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                 selectedModels.includes(m.id) ? 'bg-cyan-500 border-cyan-500' : 'bg-black/40 border-white/10'
               }`}>
                 {selectedModels.includes(m.id) && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
               </div>
               <span className={`text-sm font-bold ${selectedModels.includes(m.id) ? 'text-white' : 'text-slate-400'}`}>{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Duration & Purchase */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-6 items-end">
         <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Plan Duration</label>
            <div className="flex gap-2">
               {[1, 7, 30, 90].map(d => (
                 <button 
                   key={d} 
                   onClick={() => setDays(d)} 
                   className={`flex-1 py-3 rounded-xl border text-xs font-black transition-all ${days === d ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5'}`}
                 >
                   {d}d
                 </button>
               ))}
            </div>
         </div>
         
         <button 
           onClick={buyLicense} 
           disabled={loading || selectedModels.length === 0}
           className="w-full h-[52px] rounded-2xl bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-20"
         >
           {loading ? "Ordering..." : "Get Access Code"}
         </button>
      </div>

      {newLicenseCode && (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 animate-in zoom-in-95">
           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Access Code Ready</p>
           <code className="block break-all font-mono text-sm font-bold text-white mb-4">{newLicenseCode}</code>
           <div className="flex gap-4">
              <button 
                onClick={() => { navigator.clipboard.writeText(newLicenseCode); setStatus("Code copied!"); }} 
                className="text-[10px] font-black uppercase tracking-widest text-emerald-200 hover:text-white transition"
              >
                Copy Code
              </button>
           </div>
        </div>
      )}

      {status && (
        <p className="mt-4 text-center text-[10px] font-bold text-cyan-400 uppercase tracking-tighter animate-pulse">{status}</p>
      )}
    </div>
  );
}
