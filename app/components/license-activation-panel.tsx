"use client";

import { useEffect, useState, useCallback } from "react";

const modelLabels: Record<string, string> = {
  "glm-4.7-flash": "GLM 4.7 Flash",
  "qwen3.5": "Qwen 3.5",
};

interface UserAccess {
  model_name: string;
  expires_at: string;
}

export default function LicenseActivationPanel() {
  const [licenseKey, setLicenseKey] = useState("");
  const [access, setAccess] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const fetchAccess = useCallback(async () => {
    const res = await fetch("/api/keys/access");
    if (res.ok) setAccess(await res.json());
  }, []);

  useEffect(() => {
    fetchAccess();
    window.addEventListener("user-access-updated", fetchAccess);
    return () => window.removeEventListener("user-access-updated", fetchAccess);
  }, [fetchAccess]);

  const activateLicense = async () => {
    if (!licenseKey.trim()) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/keys/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Modules unlocked!");
        setLicenseKey("");
        fetchAccess();
        window.dispatchEvent(new Event("user-access-updated"));
      } else {
        setStatus(data.error || "Activation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="mb-4">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest">Node Activation</h3>
           <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Enter code to unlock models</p>
        </div>

        <div className="space-y-3">
           <input 
             value={licenseKey}
             onChange={(e) => setLicenseKey(e.target.value)}
             placeholder="SN-XXXX-XXXX" 
             className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-mono font-bold text-cyan-400 placeholder:text-slate-700 focus:border-cyan-500 focus:outline-none transition-all"
           />
           <button 
             onClick={activateLicense}
             disabled={loading || !licenseKey.trim()}
             className="w-full rounded-xl bg-white py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-400 disabled:opacity-30 active:scale-[0.98]"
           >
             {loading ? "Verifying..." : "Activate Node"}
           </button>
        </div>

        {status && (
           <p className="mt-3 text-center text-[9px] font-bold text-cyan-400 uppercase tracking-tighter animate-pulse">{status}</p>
        )}
      </div>

      {access.length > 0 && (
         <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.02] p-6 backdrop-blur-xl">
            <h4 className="text-[10px] font-black text-emerald-400 mb-3 uppercase tracking-widest">Active Modules</h4>
            <div className="space-y-2">
               {access.map(a => (
                 <div key={a.model_name} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <div>
                       <p className="text-[10px] font-bold text-slate-300">{modelLabels[a.model_name] || a.model_name}</p>
                       <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Exp: {new Date(a.expires_at).toLocaleDateString()}</p>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 </div>
               ))}
            </div>
         </div>
      )}
    </section>
  );
}
