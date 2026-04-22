"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";
import { useEffect, useState } from "react";

const codeModels = [
  { label: "GLM 4.7 Flash", model: "glm-4.7-flash" },
  { label: "Qwen 3.5", model: "qwen3.5" },
];

const legacyModelAliases: Record<string, string> = {
  "glm flash 4.7": "glm-4.7-flash",
  "glm-4.7-flash": "glm-4.7-flash",
  "qwen 3.5": "qwen3.5",
  "qwen3.5": "qwen3.5",
};

function normalizeModelName(name: string) {
  return legacyModelAliases[name.toLowerCase().trim()] ?? name.trim();
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return error.code === "42P01" || error.message?.includes("Could not find the table");
}

export default function KeyCenterPage() {
  const [selectedModel, setSelectedModel] = useState(codeModels[0].model);
  const [latestKey, setLatestKey] = useState("");
  const [notice, setNotice] = useState("Loading saved key...");
  const [loading, setLoading] = useState(false);

  const supabaseReady = Boolean(getSupabaseConfig());

  useEffect(() => {
    let active = true;

    const loadSavedKey = async () => {
      if (!supabaseReady) {
        setLatestKey("");
        setNotice("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError || !userData.user) {
        setLatestKey("");
        setNotice("Sign in to load and save your keys.");
        return;
      }

      const { data, error } = await supabase
        .from("user_keys")
        .select("key_value, revoked_at")
        .eq("user_id", userData.user.id)
        .in("key_name", [selectedModel, ...Object.keys(legacyModelAliases).filter((alias) => legacyModelAliases[alias] === selectedModel)])
        .maybeSingle();

      if (!active) {
        return;
      }

      if (error) {
        if (isMissingTableError(error)) {
          setLatestKey("");
          setNotice("Supabase does not have the user_keys table yet. Apply supabase/schema.sql in your Supabase SQL editor, then reload.");
          return;
        }

        setNotice(`Unable to load saved key: ${error.message}`);
        return;
      }

      if (data?.revoked_at) {
        setLatestKey("");
        setNotice(`Saved key for ${selectedModel} was revoked.`);
        return;
      }

      if (data?.key_value) {
        setLatestKey(data.key_value);
        setNotice(`Loaded saved key for ${selectedModel}.`);
        return;
      }

      setLatestKey("");
      setNotice(`No saved key for ${selectedModel} yet.`);
    };

    void loadSavedKey();

    return () => {
      active = false;
    };
  }, [selectedModel, supabaseReady]);

  const generatePurchaseKey = async () => {
    if (!supabaseReady) {
      setNotice("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setLoading(true);

    const normalizedModel = selectedModel.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const randomChunk = Math.random().toString(36).slice(2, 8).toUpperCase();
    const key = `SN-${normalizedModel}-${randomChunk}`;

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setNotice("Sign in to save keys to your account.");
        return;
      }

      const { error } = await supabase.from("user_keys").upsert(
        {
          user_id: userData.user.id,
          key_name: normalizeModelName(selectedModel),
          key_value: key,
          revoked_at: null,
        },
        {
          onConflict: "user_id,key_name",
        },
      );

      if (error) {
        if (isMissingTableError(error)) {
          setNotice("Supabase does not have the user_keys table yet. Apply supabase/schema.sql in your Supabase SQL editor, then reload.");
          return;
        }

        setNotice(`Unable to save key: ${error.message}`);
        return;
      }

      setLatestKey(key);
      setNotice(`Saved key for ${selectedModel} to your account.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b11] text-slate-100">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">SN-AI Hub</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Key Center</h1>
        <p className="mt-2 text-sm text-slate-400">Generate keys for your Code Assistant workspace.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0e1119] p-6">
          <label className="mb-2 block text-sm text-slate-300">Select Model</label>
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#080b12] px-3 py-2 text-sm"
          >
            {codeModels.map((item) => (
              <option key={item.model} value={item.model}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            onClick={generatePurchaseKey}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Generate Key"}
          </button>

          {latestKey && (
            <p className="mt-4 break-all rounded-lg border border-white/20 bg-white/5 p-3 text-xs text-slate-100">
              {latestKey}
            </p>
          )}

          <p className="mt-3 text-sm text-slate-300">{notice}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/code-assistant"
              className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100"
            >
              Open Code Assistant
            </Link>
            <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-300">
              Main Menu
            </Link>
            <Link
              href="/auth/signout"
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-300"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
