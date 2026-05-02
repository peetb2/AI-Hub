"use client";

import { useEffect, useState, useCallback } from "react";

type GatewayKeyItem = {
  id: string;
  key_prefix: string;
  allowed_models: string[];
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
};

export default function GatewayKeyPanel() {
  const [keys, setKeys] = useState<GatewayKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const loadKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/keys/list");
      const data = await response.json();
      if (response.ok) {
        setKeys(data.keys || []);
      } else {
        setStatus(data.error || "Failed to load keys.");
      }
    } catch (err) {
      setStatus("Network error loading keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
    window.addEventListener("gateway-keys-updated", loadKeys);
    return () => window.removeEventListener("gateway-keys-updated", loadKeys);
  }, [loadKeys]);

  const revokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This will immediately disconnect any apps using it.")) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (response.ok) {
        setStatus("API key successfully revoked.");
        await loadKeys();
      } else {
        const data = await response.json();
        setStatus(data.error || "Failed to revoke key.");
      }
    } catch (err) {
      setStatus("Error revoking key.");
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to permanently delete this key? This will also delete its usage history.")) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/keys/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (response.ok) {
        setStatus("API key permanently deleted.");
        await loadKeys();
      } else {
        const data = await response.json();
        setStatus(data.error || "Failed to delete key.");
      }
    } catch (err) {
      setStatus("Error deleting key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setStatus("Key prefix copied.");
    setTimeout(() => setStatus(""), 2000);
  };

  if (loading && keys.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Synchronizing gateway keys...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs font-medium text-cyan-200 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {status}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {keys.map((key) => (
          <div 
            key={key.id} 
            className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 ${
              key.is_active 
                ? "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]" 
                : "border-white/5 bg-black/40 opacity-60"
            }`}
          >
            {/* Active Glow */}
            {key.is_active && (
              <div className="absolute -left-12 -top-12 h-24 w-24 bg-cyan-500/5 blur-2xl rounded-full group-hover:bg-cyan-500/10 transition-all" />
            )}

            <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${key.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                  <code 
                    onClick={() => copyToClipboard(`mha_live_${key.key_prefix}_...`)}
                    className="cursor-pointer text-sm font-mono font-bold tracking-tight text-white group-hover:text-cyan-400 transition"
                  >
                    mha_live_{key.key_prefix}_***
                  </code>
                  {!key.is_active && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Revoked</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(key.allowed_models || []).map(m => (
                    <span key={m} className="rounded-lg bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-slate-500">
                   <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(key.created_at).toLocaleDateString()}
                   </div>
                   {key.last_used_at && (
                     <div className="flex items-center gap-1.5 text-cyan-400/70">
                        <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Last used: {new Date(key.last_used_at).toLocaleDateString()}
                     </div>
                   )}
                   {key.expires_at && (
                     <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                     </div>
                   )}
                </div>
              </div>

              {key.is_active ? (
                <button
                  onClick={() => revokeKey(key.id)}
                  className="shrink-0 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-400 transition hover:bg-rose-500/20 hover:border-rose-500/40 active:scale-95"
                >
                  Revoke
                </button>
              ) : (
                <button
                  onClick={() => deleteKey(key.id)}
                  className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-400 transition hover:bg-white/10 hover:border-white/20 active:scale-95"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {keys.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743-5.743L11 3L11 7H7L3 11l4.257 4.257A6 6 0 1115 7z" /></svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No active gateway keys</p>
            <p className="mt-1 text-xs text-slate-600">Redeem a key below to start using the hub externally.</p>
          </div>
        )}
      </div>
    </div>
  );
}
