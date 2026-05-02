"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LicenseKey {
  id: string;
  key_value: string;
  allowed_models: string[];
  duration_days: number;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
}

const availableModels = [
    { id: "glm-4.7-flash", label: "GLM 4.7 Flash" },
    { id: "qwen3.5", label: "Qwen 3.5" },
];

export default function LicenseFactoryPage() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const fetchLicenses = async () => {
    const res = await fetch("/api/admin/licenses");
    if (res.ok) setLicenses(await res.json());
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const generateLicense = async () => {
    if (selectedModels.length === 0) return setStatus("Select models.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: selectedModels, days }),
      });
      if (res.ok) {
        setStatus("License generated!");
        fetchLicenses();
        setSelectedModels([]);
      } else {
        setStatus("Failed to generate.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
           <p className="text-xs font-black uppercase tracking-widest text-purple-400">Hub Factory</p>
           <h1 className="text-3xl font-bold text-white mt-1">License Manager</h1>
        </div>
        <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
            Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Generator Form */}
        <div className="rounded-[2.5rem] border border-purple-500/20 bg-purple-500/[0.02] p-8 backdrop-blur-xl">
           <h3 className="text-lg font-bold text-white mb-6">Issue New Access</h3>
           
           <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Bundle Models</label>
                <div className="grid grid-cols-1 gap-2">
                   {availableModels.map(m => (
                     <label key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedModels.includes(m.id) ? 'border-purple-500/50 bg-purple-500/10 text-white' : 'border-white/5 bg-black/40 text-slate-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-3">
                           <input type="checkbox" checked={selectedModels.includes(m.id)} onChange={e => {
                               setSelectedModels(e.target.checked ? [...selectedModels, m.id] : selectedModels.filter(id => id !== m.id))
                           }} className="h-4 w-4 rounded border-white/20 bg-black text-purple-500 focus:ring-purple-500" />
                           <span className="text-sm font-bold">{m.label}</span>
                        </div>
                     </label>
                   ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Duration (Days)</label>
                <div className="flex gap-2">
                   {[1, 7, 30, 90].map(d => (
                     <button key={d} onClick={() => setDays(d)} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${days === d ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/5 bg-black/20 text-slate-400'}`}>{d}d</button>
                   ))}
                </div>
              </div>

              <button onClick={generateLicense} disabled={loading} className="w-full py-4 rounded-2xl bg-purple-500 text-white text-sm font-black uppercase tracking-widest hover:bg-purple-400 transition-all active:scale-[0.98] disabled:opacity-50">
                 {loading ? "Generating..." : "Generate License Code"}
              </button>
              {status && <p className="text-center text-[10px] font-bold text-purple-400 uppercase tracking-tighter animate-pulse">{status}</p>}
           </div>
        </div>

        {/* License Table */}
        <div className="rounded-[2.5rem] border border-white/5 bg-black/40 p-8 backdrop-blur-xl">
           <h3 className="text-lg font-bold text-white mb-6">Recent Licenses</h3>
           <div className="overflow-x-auto">
              <table className="w-full text-sm">
                 <thead>
                    <tr className="border-b border-white/5 text-left text-slate-500">
                       <th className="pb-3 font-bold uppercase tracking-tighter text-[10px]">License Key</th>
                       <th className="pb-3 font-bold uppercase tracking-tighter text-[10px]">Models</th>
                       <th className="pb-3 font-bold uppercase tracking-tighter text-[10px]">Status</th>
                       <th className="pb-3 font-bold uppercase tracking-tighter text-[10px] text-right">Created</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/[0.03]">
                    {licenses.map(lic => (
                      <tr key={lic.id} className="group">
                         <td className="py-4">
                            <code className="text-xs font-mono font-bold text-purple-400">{lic.key_value}</code>
                         </td>
                         <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                               {lic.allowed_models.map(m => <span key={m} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-slate-400">{m}</span>)}
                            </div>
                         </td>
                         <td className="py-4">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">Multi-Use</span>
                         </td>
                         <td className="py-4 text-right text-xs text-slate-500">
                            {new Date(lic.created_at).toLocaleDateString()}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              {licenses.length === 0 && <p className="text-center py-10 text-sm text-slate-600">No licenses issued yet.</p>}
           </div>
        </div>
      </div>
    </div>
  );
}
