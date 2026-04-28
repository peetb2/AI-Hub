"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

const codeModels = [
  { label: "GLM 4.7 Flash", model: "glm-4.7-flash" },
  { label: "Qwen 3.5", model: "qwen3.5" },
];

const modelAliases: Record<string, string> = {
  "glm flash 4.7": "glm-4.7-flash",
  "glm-4.7-flash": "glm-4.7-flash",
  "qwen 3.5": "qwen3.5",
  "qwen3.5": "qwen3.5",
};

function normalizeModelName(name: string) {
  return modelAliases[name.toLowerCase().trim()] ?? name.trim();
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return error.code === "42P01" || error.message?.includes("Could not find the table");
}

type UserKeyRow = {
  id: string;
  key_name: string;
  key_value: string;
  revoked_at: string | null;
  created_at: string;
  expires_at?: string | null;
};

type RedeemResponse = {
  id: string;
  key: string;
  allowedModel: string;
  createdAt: string;
  expiresAt: string | null;
  error?: string;
};

export default function KeyCenterPanel() {
  const [selectedModel, setSelectedModel] = useState(codeModels[0].model);
  const [keyValue, setKeyValue] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [latestKey, setLatestKey] = useState("");
  const [savedRows, setSavedRows] = useState<UserKeyRow[]>([]);
  const [expirySupported, setExpirySupported] = useState(true);
  const [notice, setNotice] = useState("Loading saved keys...");
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");

  const supabaseReady = Boolean(getSupabaseConfig());

  const loadSavedKeys = useCallback(async (canReadExpiry: boolean) => {
    if (!supabaseReady) {
      setLatestKey("");
      setKeyValue("");
      setSavedRows([]);
      setNotice("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setLatestKey("");
      setKeyValue("");
      setSavedRows([]);
      setNotice("Sign in to load and save your model keys.");
      return;
    }

    const selectFields = canReadExpiry
      ? "id, key_name, key_value, revoked_at, created_at, expires_at"
      : "id, key_name, key_value, revoked_at, created_at";

    const { data, error } = await supabase
      .from("user_keys")
      .select(selectFields)
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        setLatestKey("");
        setKeyValue("");
        setSavedRows([]);
        setNotice("Supabase does not have the user_keys table yet. Apply supabase/schema.sql in your Supabase SQL editor, then reload.");
        return;
      }

      if (canReadExpiry && error.code === "42703") {
        setExpirySupported(false);
        await loadSavedKeys(false);
        return;
      }

      setNotice(`Unable to load keys: ${error.message}`);
      return;
    }

    const activeRows = ((data ?? []) as unknown as UserKeyRow[]).filter((row) => !row.revoked_at);
    setSavedRows(activeRows);

    const selectedRow = activeRows.find((row) => normalizeModelName(row.key_name) === selectedModel) ?? null;

    if (!selectedRow) {
      setLatestKey("");
      setKeyValue("");
      setNotice(`No saved key for ${selectedModel} yet.`);
      return;
    }

    setLatestKey(selectedRow.key_value);
    setKeyValue(selectedRow.key_value);

    if (canReadExpiry && selectedRow.expires_at) {
      const remainingDays = Math.max(1, Math.ceil((new Date(selectedRow.expires_at).getTime() - Date.now()) / 86400000));
      setExpiryDays(String(remainingDays));
    }

    setNotice(`Loaded saved key for ${selectedModel}.`);
  }, [selectedModel, supabaseReady]);

  useEffect(() => {
    void loadSavedKeys(true);
  }, [loadSavedKeys]);

  const generatePreviewKey = () => {
    const modelChunk = selectedModel.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const randomChunk = Math.random().toString(36).slice(2, 8).toUpperCase();
    setKeyValue(`SN-${modelChunk}-${randomChunk}`);
    setNotice(`Key preview generated for ${selectedModel}.`);
  };

  const saveModelKey = async () => {
    if (!supabaseReady) {
      setNotice("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setLoading(true);
    setNewApiKey("");

    const parsedDays = Number.parseInt(expiryDays, 10);
    const expiresAt = Number.isFinite(parsedDays) && parsedDays > 0 ? new Date(Date.now() + parsedDays * 86400000).toISOString() : null;
    const fallbackKey = `SN-${selectedModel.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const finalKey = keyValue.trim() || fallbackKey;

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setNotice("Sign in to save keys to your account.");
        return;
      }

      const baseRecord = {
        user_id: userData.user.id,
        key_name: normalizeModelName(selectedModel),
        key_value: finalKey,
        revoked_at: null,
      };

      const record = expirySupported ? { ...baseRecord, expires_at: expiresAt } : baseRecord;
      const { error } = await supabase.from("user_keys").upsert(record, {
        onConflict: "user_id,key_name",
      });

      if (error) {
        if (isMissingTableError(error)) {
          setNotice("Supabase does not have the user_keys table yet. Apply supabase/schema.sql in your Supabase SQL editor, then reload.");
          return;
        }

        if (expirySupported && error.code === "42703") {
          setExpirySupported(false);
          const retry = await supabase.from("user_keys").upsert(baseRecord, {
            onConflict: "user_id,key_name",
          });

          if (!retry.error) {
            setLatestKey(finalKey);
            setKeyValue(finalKey);
            setNotice("Saved key, but your database still needs the expires_at column for expiry support.");
            await loadSavedKeys(false);
            return;
          }

          setNotice(`Unable to save key: ${retry.error.message}`);
          return;
        }

        setNotice(`Unable to save key: ${error.message}`);
        return;
      }

      setLatestKey(finalKey);
      setKeyValue(finalKey);
      setNotice(expiresAt ? `Saved ${selectedModel} key for ${parsedDays} days.` : `Saved ${selectedModel} key.`);
      await loadSavedKeys(expirySupported);
    } finally {
      setLoading(false);
    }
  };

  const revokeSavedKey = async (row: UserKeyRow) => {
    if (!supabaseReady) {
      setNotice("Supabase is not configured.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", row.id);

      if (error) {
        setNotice(`Unable to revoke key: ${error.message}`);
        return;
      }

      if (normalizeModelName(row.key_name) === selectedModel) {
        setLatestKey("");
        setKeyValue("");
      }

      setNotice(`Revoked key for ${row.key_name}.`);
      await loadSavedKeys(expirySupported);
    } finally {
      setLoading(false);
    }
  };

  const redeemApiKey = async () => {
    const personalKey = keyValue.trim();

    if (!personalKey) {
      setNotice("Enter or load your personal key before redeeming.");
      return;
    }

    setRedeeming(true);
    setNewApiKey("");

    try {
      const response = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          personalKey,
          expiresInDays: Number.parseInt(expiryDays, 10),
        }),
      });

      const data = (await response.json()) as RedeemResponse;

      if (!response.ok) {
        setNotice(data.error ?? "Unable to redeem API key.");
        return;
      }

      setNewApiKey(data.key);
      setNotice(`API key issued for ${selectedModel}. Copy it now; it will not be shown again.`);
    } finally {
      setRedeeming(false);
    }
  };

  const copyApiKey = async () => {
    if (!newApiKey) {
      return;
    }

    await navigator.clipboard.writeText(newApiKey);
    setNotice("API key copied to clipboard.");
  };

  return (
    <section id="key-center" className="rounded-3xl border border-white/10 bg-black/90 shadow-xl backdrop-blur-md">
      <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-7">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Personal Key Center</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-white">Generate and manage model keys</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Save one key per model, update or revoke it anytime, then redeem that key to issue a real API key.
          </p>

          {!expirySupported && (
            <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Your database still needs the <span className="font-semibold">expires_at</span> column on <span className="font-semibold">user_keys</span>.
            </p>
          )}

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Active model keys</p>
              <p className="mt-2 text-2xl font-semibold text-white">{savedRows.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Current key</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{latestKey ? `${latestKey.slice(0, 12)}...` : "None"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Expiry</p>
              <p className="mt-2 text-sm font-medium text-white">{expiryDays} days</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Saved model keys</p>
              <p className="text-xs text-slate-500">{savedRows.length} total</p>
            </div>
            <div className="mt-3 space-y-2">
              {savedRows.length > 0 ? (
                savedRows.map((row) => {
                  const normalized = normalizeModelName(row.key_name);
                  const modelLabel = codeModels.find((item) => item.model === normalized)?.label ?? row.key_name;
                  const isSelected = normalized === selectedModel;
                  return (
                    <div key={row.id} className={`rounded-lg border p-2.5 ${isSelected ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-black/40"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-200">{modelLabel}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedModel(normalized);
                              setKeyValue(row.key_value);
                            }}
                            className="rounded border border-white/20 px-2 py-1 text-[11px] text-slate-200 transition hover:bg-white/10"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => void revokeSavedKey(row)}
                            disabled={loading}
                            className="rounded border border-rose-400/40 px-2 py-1 text-[11px] text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No keys saved yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Model</label>
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2.5 text-sm transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
              >
                {codeModels.map((item) => (
                  <option key={item.model} value={item.model}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Expire after days</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={expiryDays}
                onChange={(event) => setExpiryDays(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2.5 text-sm transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Personal key value</label>
            <input
              value={keyValue}
              onChange={(event) => setKeyValue(event.target.value)}
              placeholder="Enter or generate your model key"
              className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2.5 text-sm font-mono tracking-wide text-slate-100 transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => void saveModelKey()}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Model Key"}
            </button>

            <button
              onClick={generatePreviewKey}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Generate Preview
            </button>

            <button
              onClick={() => void redeemApiKey()}
              disabled={redeeming}
              className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-60"
            >
              {redeeming ? "Redeeming..." : "Redeem API Key"}
            </button>
          </div>

          {latestKey && (
            <div className="mt-4 rounded-lg border border-white/20 bg-white/10 p-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Saved personal key</p>
              <p className="break-all text-xs font-mono text-slate-100">{latestKey}</p>
            </div>
          )}

          {newApiKey && (
            <div className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-emerald-200">Redeemed API key</p>
              <p className="break-all text-xs font-mono text-emerald-100">{newApiKey}</p>
              <button
                onClick={() => void copyApiKey()}
                className="mt-3 rounded-md border border-emerald-200/40 px-3 py-1 text-xs text-emerald-100 transition hover:bg-emerald-200/10"
              >
                Copy API Key
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
            <Link href="/code-assistant" className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-300/20">
              Open Workspace
            </Link>
            <Link href="/api-keys" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/20">
              Manage API Keys
            </Link>
          </div>

          {notice && <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-400">{notice}</p>}
        </div>
      </div>
    </section>
  );
}
