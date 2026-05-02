"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface GatewayKey {
  id: string;
  user_id: string;
  email: string;
  key_prefix: string;
  allowed_models: string[];
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export default function AdminGatewayKeysPage() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<GatewayKey[]>([]);
  const [status, setStatus] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/admin/gateway-keys/list");
      if (response.ok) {
        const data = await response.json();
        setKeys(data);
      } else {
        setStatus("Failed to load gateway keys.");
      }
    } catch (err) {
      setStatus("Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const revokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this access key? This cannot be undone.")) {
      return;
    }

    setActionId(id);
    try {
      const response = await fetch(`/api/admin/gateway-keys/revoke/${id}`, {
        method: "POST",
      });

      if (response.ok) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, is_active: false } : k))
        );
        setStatus("Key revoked successfully.");
      } else {
        setStatus("Failed to revoke key.");
      }
    } catch (err) {
      setStatus("Error revoking key.");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111318] text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading gateway keys...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">SN-AI Hub</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Gateway Access Keys</h1>
        <p className="mt-2 text-sm text-slate-400">Manage API keys used by external clients (Continue, OpenAI SDK) to access the hub.</p>

        {status && (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-slate-300 backdrop-blur-md">
            {status}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/90 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active & Inactive Keys</h2>
            <Link href="/admin" className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
              Back to Admin
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="pb-3 font-semibold">User Email</th>
                  <th className="pb-3 font-semibold">Key Prefix</th>
                  <th className="pb-3 font-semibold">Models</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-center">Last Used</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 text-slate-200">{key.email}</td>
                    <td className="py-4">
                      <code className="text-xs text-cyan-400/80">mha_live_{key.key_prefix}_***</code>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {(key.allowed_models || []).map(m => (
                          <span key={m} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      {key.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-400/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-rose-400/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-400/20">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center text-xs text-slate-500">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-4 text-right">
                      {key.is_active && (
                        <button
                          onClick={() => revokeKey(key.id)}
                          disabled={actionId === key.id}
                          className="text-xs text-rose-300 hover:text-rose-100 transition disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {keys.length === 0 && (
              <div className="py-12 text-center text-slate-500">No access keys found.</div>
            )}
          </div>
        </div>
      </div>
  );
}
