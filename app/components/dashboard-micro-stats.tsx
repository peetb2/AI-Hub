"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  activeKeysCount: number;
  modelsCount: number;
}

export default function DashboardMicroStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl group transition-all hover:border-cyan-500/30">
        <div className="absolute -right-4 -top-4 h-24 w-24 bg-cyan-500/10 blur-2xl rounded-full" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Gateway Status</span>
        <div className="mt-4 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-white tracking-tight">{stats?.activeKeysCount ?? "-"}</h3>
          <span className="text-sm text-slate-500 font-medium text-white/60">Active Keys</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Hub Proxy Online</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl group transition-all hover:border-purple-500/30">
        <div className="absolute -right-4 -top-4 h-24 w-24 bg-purple-500/10 blur-2xl rounded-full" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Model Library</span>
        <div className="mt-4 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-white tracking-tight">{stats?.modelsCount ?? "-"}</h3>
          <span className="text-sm text-slate-500 font-medium text-white/60">Activated</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Ready to Bundle</span>
        </div>
      </div>
    </>
  );
}
