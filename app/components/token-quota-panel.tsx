'use client';

import { useEffect, useState, useCallback } from 'react';

interface QuotaInfo {
  used: number;
  quota: number;
  remaining: number;
  percentUsed: number;
}

export default function TokenQuotaPanel() {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotaInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/token-quota/my-quota');
      if (!response.ok) throw new Error('Failed to fetch quota info');
      const data = await response.json();
      setQuotaInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quota');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotaInfo();
  }, [fetchQuotaInfo]);

  if (loading) {
    return (
      <div className="flex-1 rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="h-8 w-48 bg-white/10 rounded" />
      </div>
    );
  }

  if (error || !quotaInfo) {
    return (
      <div className="flex-1 rounded-3xl border border-rose-500/10 bg-rose-500/[0.02] p-6 backdrop-blur-xl">
        <p className="text-rose-400 text-sm">{error || 'Failed to load quota info'}</p>
      </div>
    );
  }

  const { used, quota, remaining, percentUsed } = quotaInfo;

  return (
    <div className="relative overflow-hidden flex-1 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl group transition-all hover:border-emerald-500/30">
      {/* Background Glow */}
      <div className="absolute -right-4 -top-4 h-24 w-24 bg-emerald-500/10 blur-2xl rounded-full transition-all group-hover:bg-emerald-500/20" />
      
      <div className="relative flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Monthly Quota</span>
            <button onClick={fetchQuotaInfo} className="text-slate-500 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </button>
          </div>
          
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">{(remaining / 1000).toFixed(1)}k</h3>
            <span className="text-sm text-slate-500 font-medium">characters left</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1.5 px-0.5">
            <span>{percentUsed}% CONSUMED</span>
            <span>{quota.toLocaleString()} TOTAL</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                percentUsed > 90 ? 'bg-rose-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
