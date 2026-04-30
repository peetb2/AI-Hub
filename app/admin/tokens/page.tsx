"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

interface AIToken {
  id: string;
  user_id: string;
  token_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  profiles: { email: string } | null;
}

export default function AdminTokensPage() {
  const config = getSupabaseConfig();
  const supabase = useMemo(() => (config ? createClient() : null), [config?.url, config?.anonKey]);

  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<AIToken[]>([]);
  const [status, setStatus] = useState("");
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const checkAdminAndLoadTokens = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          // still attempt to load tokens (server may allow)
        }

        // Load all tokens (server-side route no longer requires admin role)
        const response = await fetch("/api/admin/ai-tokens/list");
        if (response.ok) {
          const data = await response.json();
          if (active) {
            setTokens(data);
          }
        }
      } catch (err) {
        console.error("Failed to load tokens:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void checkAdminAndLoadTokens();

    return () => {
      active = false;
    };
  }, [supabase]);

  const deleteToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token?")) {
      return;
    }

    setDeletingTokenId(tokenId);

    try {
      const response = await fetch(`/api/admin/ai-tokens/delete/${tokenId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
        setStatus("Token revoked successfully.");
      } else {
        const error = await response.json();
        setStatus(error.error || "Failed to revoke token.");
      }
    } catch (err) {
      setStatus("Error revoking token. Please try again.");
    } finally {
      setDeletingTokenId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111318] text-slate-100 flex items-center justify-center px-6">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  // No admin gating: page is accessible if server returns data

  return (
    <div
      className="min-h-screen text-slate-100"
      style={{
        backgroundColor: "#111318",
        backgroundImage: "url('/topography.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "600px 600px",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">SN-AI Hub</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin: User Token Management</h1>
        <p className="mt-2 text-sm text-slate-400">View and manage every user token from one place.</p>

        {status && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/90 p-4 text-sm text-slate-300 shadow-xl backdrop-blur-md">
            {status}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/90 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">All User Tokens</h2>
              <p className="mt-1 text-sm text-slate-400">{tokens.length} total token{tokens.length === 1 ? "" : "s"}.</p>
            </div>
            <Link href="/settings" className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
              Back to Settings
            </Link>
          </div>

          {tokens.length === 0 ? (
            <p className="text-sm text-slate-400">No AI tokens have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-300">
                    <th className="pb-3 font-semibold">User Email</th>
                    <th className="pb-3 font-semibold">Token</th>
                    <th className="pb-3 font-semibold">Created</th>
                    <th className="pb-3 font-semibold">Last Used</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="py-3 text-slate-200">{token.profiles?.email || "Unknown User"}</td>
                      <td className="py-3">
                        <span className="font-mono text-xs text-slate-400">{token.token_prefix}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-400">{new Date(token.created_at).toLocaleString()}</td>
                      <td className="py-3 text-xs text-slate-400">{token.last_used_at ? new Date(token.last_used_at).toLocaleString() : "Never"}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteToken(token.id)}
                          disabled={deletingTokenId === token.id}
                          className="rounded-md border border-rose-300/40 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
                        >
                          {deletingTokenId === token.id ? "..." : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
