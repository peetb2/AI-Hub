'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetchQuotaInfo();
  }, []);

  const fetchQuotaInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/token-quota/my-quota');
      if (!response.ok) throw new Error('Failed to fetch quota info');
      const data = await response.json();
      setQuotaInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quota');
      setQuotaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed < 50) return 'bg-emerald-500';
    if (percentUsed < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-black/90 border border-white/10 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-white/10 rounded w-full mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !quotaInfo) {
    return (
      <div className="bg-black/90 border border-white/10 rounded-lg p-6">
        <p className="text-red-400 text-sm">{error || 'Failed to load quota info'}</p>
      </div>
    );
  }

  const { used, quota, remaining, percentUsed } = quotaInfo;

  return (
    <div className="bg-black/90 border border-white/10 rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Monthly Token Quota</h3>
          <span className="text-sm text-white/60">{percentUsed}% used</span>
        </div>
        <p className="text-xs text-white/50">
          {used.toLocaleString()} / {quota.toLocaleString()} characters
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getProgressColor(percentUsed)} transition-all duration-300`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        ></div>
      </div>

      {/* Remaining Text */}
      <div className="pt-2 border-t border-white/10">
        <p className="text-sm text-emerald-400">
          {remaining.toLocaleString()} characters remaining this month
        </p>
        {percentUsed >= 80 && (
          <p className="text-xs text-yellow-400 mt-2">
            ⚠️ You're using {percentUsed}% of your quota. Contact an admin if you need more.
          </p>
        )}
        {remaining <= 0 && (
          <p className="text-xs text-red-400 mt-2">
            ❌ You've reached your monthly quota limit. Please try again next month.
          </p>
        )}
      </div>

      <button
        onClick={fetchQuotaInfo}
        className="w-full text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
