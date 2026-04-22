"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";
import { useEffect, useState } from "react";

const modeOptions = ["agent", "text"];

const modelAliases: Record<string, string> = {
  "glm flash 4.7": "glm-4.7-flash",
  "glm-4.7-flash": "glm-4.7-flash",
  "qwen 3.5": "qwen3.5",
  "qwen3.5": "qwen3.5",
};

const modelLabels: Record<string, string> = {
  "glm-4.7-flash": "GLM 4.7 Flash",
  "qwen3.5": "Qwen 3.5",
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

export default function CodeAssistantPage() {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedMode, setSelectedMode] = useState(modeOptions[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    [],
  );
  const [notice, setNotice] = useState("Loading activated models...");
  const [sending, setSending] = useState(false);

  const supabaseReady = Boolean(getSupabaseConfig());

  useEffect(() => {
    let active = true;

    const loadModels = async () => {
      if (!supabaseReady) {
        setAvailableModels([]);
        setSelectedModel("");
        setNotice("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError || !userData.user) {
        setAvailableModels([]);
        setSelectedModel("");
        setNotice("Sign in to use activated models.");
        return;
      }

      const { data, error } = await supabase
        .from("user_keys")
        .select("key_name, revoked_at")
        .eq("user_id", userData.user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: true });

      if (!active) {
        return;
      }

      if (error) {
        if (isMissingTableError(error)) {
          setAvailableModels([]);
          setSelectedModel("");
          setNotice("Supabase does not have the user_keys table yet. Apply supabase/schema.sql in your Supabase SQL editor, then reload.");
          return;
        }

        setAvailableModels([]);
        setSelectedModel("");
        setNotice(`Unable to load activated models: ${error.message}`);
        return;
      }

      const models = Array.from(
        new Set((data ?? []).map((row) => normalizeModelName(row.key_name)).filter(Boolean)),
      );

      setAvailableModels(models);

      if (models.length === 0) {
        setSelectedModel("");
        setNotice("Activate a key in Key Center to unlock a model here.");
        return;
      }

      setSelectedModel((currentModel) => (models.includes(currentModel) ? currentModel : models[0]));
      setNotice("Loaded activated models from your account.");
    };

    void loadModels();

    return () => {
      active = false;
    };
  }, [supabaseReady]);

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    if (!selectedModel) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Activate a model key first, then come back here to chat." },
      ]);
      return;
    }

    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          mode: selectedMode,
          prompt: trimmed,
        }),
      });

      const data = (await response.json()) as { content?: string; error?: string; details?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Local AI request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.content ?? "No response content returned." }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown local AI error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Could not reach the local AI endpoint. ${message}. Check that Ollama is running and available at ${process.env.NEXT_PUBLIC_LOCAL_AI_BASE_URL ?? "http://localhost:11434/v1"}.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const navItems = ["New Agent", "Automations", "Dashboard", "AI Chat"];

  return (
    <div className="min-h-screen bg-[#090b11] text-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-white/10 bg-[#07090f] md:w-72 md:border-b-0 md:border-r">
          <div className="p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">SN-AI Hub</p>
            <h1 className="mt-2 text-xl font-semibold text-white">Workspace</h1>
          </div>

          <nav className="px-3">
            {navItems.map((item) => (
              <div
                key={item}
                className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  item === "AI Chat"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {item}
              </div>
            ))}

            <Link
              href="/key-center"
              className="mb-1 block w-full rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-left text-sm font-medium text-emerald-200 transition hover:bg-emerald-300/20"
            >
              Key Center
            </Link>
            <Link
              href="/api-keys"
              className="mb-1 block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
            >
              API Keys
            </Link>
          </nav>

          <div className="flex items-center justify-between px-4 py-4 text-xs text-slate-400">
            <span>Free Plan</span>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-emerald-300 hover:text-emerald-200">
                Main Menu
              </Link>
              <Link href="/auth/signout" className="text-slate-300 hover:text-white">
                Sign Out
              </Link>
            </div>
          </div>
        </aside>

        <main className="relative flex-1 bg-[#0a0d14] p-5 md:p-8">
          <div className="pointer-events-none absolute right-8 top-8 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-400">AI Chat</p>
            </div>

            <div className="mb-5 min-h-40 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-2xl p-3 text-sm ${
                    message.role === "user"
                      ? "ml-auto rounded-br-md border border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "rounded-bl-md border border-white/10 bg-[#101723] text-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111318] p-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="h-24 w-full resize-none bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
                placeholder="Ask Cursor to build, fix bugs, explore"
              />
              {notice && (
                <p className="mt-2 text-xs text-slate-400">{notice}</p>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <select
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    disabled={availableModels.length === 0}
                    className="rounded-md border border-white/15 bg-[#0f131d] px-2 py-1 text-xs text-slate-200 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {availableModels.length > 0 ? "Select model" : "No activated models"}
                    </option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {modelLabels[model] ?? model}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedMode}
                    onChange={(event) => setSelectedMode(event.target.value)}
                    className="rounded-md border border-white/15 bg-[#0f131d] px-2 py-1 text-xs text-slate-200"
                  >
                    {modeOptions.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                  aria-label="Send message"
                >
                  {sending ? "..." : "↗"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
