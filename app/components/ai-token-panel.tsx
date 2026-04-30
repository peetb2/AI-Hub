"use client";

import { useEffect, useState, type FormEvent } from "react";

type AIToken = {
  id: string;
  token_prefix: string;
  is_active: boolean;
  created_at: string;
};

export default function AITokenPanel() {
  const [aiTokens, setAiTokens] = useState<AIToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [addingToken, setAddingToken] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoadingTokens(true);

    const loadTokens = async () => {
      try {
        const response = await fetch("/api/ai-tokens/list");
        if (response.ok) {
          const data = await response.json();
          setAiTokens(data);
        }
      } catch (error) {
        console.error("Failed to load tokens:", error);
      } finally {
        setLoadingTokens(false);
      }
    };

    void loadTokens();
  }, []);

  const addAiToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tokenValue.trim()) {
      setStatus("Token value cannot be empty.");
      return;
    }

    setAddingToken(true);
    setStatus("");

    try {
      const response = await fetch("/api/ai-tokens/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenValue.trim() }),
      });

      if (response.ok) {
        const newToken = await response.json();
        setAiTokens([newToken]);
        setTokenValue("");
        setStatus("Personal token saved successfully.");
      } else {
        const error = await response.json();
        setStatus(error.error || "Failed to add token.");
      }
    } catch (error) {
      setStatus("Error adding token. Please try again.");
    } finally {
      setAddingToken(false);
    }
  };

  const deleteAiToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to delete this token?")) {
      return;
    }

    setDeletingTokenId(tokenId);

    try {
      const response = await fetch(`/api/ai-tokens/delete/${tokenId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAiTokens((prev) => prev.filter((token) => token.id !== tokenId));
        setStatus("AI token deleted successfully.");
      } else {
        const error = await response.json();
        setStatus(error.error || "Failed to delete token.");
      }
    } catch (error) {
      setStatus("Error deleting token. Please try again.");
    } finally {
      setDeletingTokenId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-black/90 p-6 shadow-xl backdrop-blur-md">
      <h2 className="text-lg font-semibold text-white">User Token Management</h2>
      <p className="mt-1 text-sm text-slate-400">Manage your personal token for this account. You can replace it at any time.</p>

      <form onSubmit={addAiToken} className="mt-5 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Token</span>
          <input
            type="password"
            value={tokenValue}
            onChange={(event) => setTokenValue(event.target.value)}
            placeholder="Paste your personal token"
            className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
          />
        </label>

        <button
          type="submit"
          disabled={addingToken}
          className="rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:opacity-60"
        >
          {addingToken ? "Saving..." : "Save Token"}
        </button>
      </form>

      {loadingTokens ? (
        <p className="mt-4 text-sm text-slate-400">Loading your token...</p>
      ) : aiTokens.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white">Saved Token</h3>
          <p className="mt-1 text-sm text-slate-400">Your account has {aiTokens.length} saved token{aiTokens.length === 1 ? "" : "s"}.</p>

          <div className="mt-4 space-y-3">
            {aiTokens.map((token) => (
              <div key={token.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="mt-1 text-xs text-slate-400">
                      Token: <span className="font-mono text-slate-300">{token.token_prefix}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created: {new Date(token.created_at).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteAiToken(token.id)}
                    disabled={deletingTokenId === token.id}
                    className="shrink-0 rounded-md border border-rose-300/40 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
                  >
                    {deletingTokenId === token.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No user token saved yet.</p>
      )}

      {status && (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          {status}
        </p>
      )}
    </section>
  );
}