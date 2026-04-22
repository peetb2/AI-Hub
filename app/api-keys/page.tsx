"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApiKeyItem = {
  id: string;
  key_prefix: string;
  allowed_model: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
};

type NewApiKeyResponse = {
  id: string;
  key: string;
  allowedModel: string;
  createdAt: string;
  expiresAt: string | null;
};

const modelOptions = [
  { label: "GLM 4.7 Flash", value: "glm-4.7-flash" },
  { label: "Qwen 3.5", value: "qwen3.5" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [status, setStatus] = useState("Loading API keys...");
  const [selectedModel, setSelectedModel] = useState(modelOptions[0].value);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);

  const loadKeys = async () => {
    const response = await fetch("/api/keys/list", { method: "GET" });
    const data = (await response.json()) as { keys?: ApiKeyItem[]; error?: string };

    if (!response.ok) {
      setStatus(data.error ?? "Unable to load API keys.");
      return;
    }

    setKeys(data.keys ?? []);
    setStatus(data.keys?.length ? "API keys loaded." : "No API keys yet. Create your first key.");
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const createKey = async () => {
    setLoading(true);
    setNewKey("");

    try {
      const response = await fetch("/api/keys/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: selectedModel }),
      });

      const data = (await response.json()) as NewApiKeyResponse & { error?: string };

      if (!response.ok) {
        setStatus(data.error ?? "Unable to create API key.");
        return;
      }

      setNewKey(data.key);
      setStatus("New API key created. Copy it now; this is the only time it is shown.");
      await loadKeys();
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/keys/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setStatus(data.error ?? "Unable to revoke API key.");
        return;
      }

      setStatus("API key revoked.");
      await loadKeys();
    } finally {
      setLoading(false);
    }
  };

  const copyNewKey = async () => {
    if (!newKey) {
      return;
    }

    await navigator.clipboard.writeText(newKey);
    setStatus("API key copied to clipboard.");
  };

  return (
    <div className="min-h-screen bg-[#090b11] text-slate-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">SN-AI Hub</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">API Keys</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create and manage gateway keys for Continue and OpenAI-compatible clients.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0e1119] p-6">
          <label className="mb-2 block text-sm text-slate-300">Allowed Model</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="rounded-lg border border-white/20 bg-[#080b12] px-3 py-2 text-sm"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={createKey}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Working..." : "Create API Key"}
            </button>
          </div>

          {newKey && (
            <div className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-200">Copy This Key Now</p>
              <p className="mt-2 break-all text-sm text-emerald-100">{newKey}</p>
              <button
                onClick={copyNewKey}
                className="mt-3 rounded-md border border-emerald-200/40 px-3 py-1 text-xs text-emerald-100"
              >
                Copy Key
              </button>
            </div>
          )}

          <p className="mt-4 text-sm text-slate-300">{status}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0e1119] p-6">
          <h2 className="text-lg font-semibold text-white">Existing Keys</h2>

          <div className="mt-4 space-y-3">
            {keys.map((keyItem) => (
              <div key={keyItem.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">
                  Prefix: <span className="font-mono text-slate-100">mha_live_{keyItem.key_prefix}_***</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">Model: {keyItem.allowed_model}</p>
                <p className="mt-1 text-xs text-slate-400">Created: {new Date(keyItem.created_at).toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Last used: {keyItem.last_used_at ? new Date(keyItem.last_used_at).toLocaleString() : "Never"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Status: {keyItem.is_active ? "Active" : "Revoked"}
                </p>

                {keyItem.is_active && (
                  <button
                    onClick={() => revokeKey(keyItem.id)}
                    disabled={loading}
                    className="mt-3 rounded-md border border-rose-300/40 px-3 py-1 text-xs text-rose-200 disabled:opacity-60"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}

            {keys.length === 0 && (
              <p className="text-sm text-slate-400">No keys available yet.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/code-assistant" className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
            Open Code Assistant
          </Link>
          <Link href="/key-center" className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-300">
            Key Center
          </Link>
          <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-300">
            Main Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
