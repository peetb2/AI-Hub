"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    [],
  );
  const [notice, setNotice] = useState("Loading activated models...");
  const [sending, setSending] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
        setIsAdmin(false);
        setNotice("Sign in to use activated models.");
        return;
      }

      if (userData.user.user_metadata?.role === "admin" || userData.user.app_metadata?.role === "admin") {
        setIsAdmin(true);
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .maybeSingle();

        setIsAdmin(profile?.role === "admin");
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

      const key = `matcha-ai-hub:code-assistant:${userData.user.id}`;
      setStorageKey(key);

      const savedStateRaw = window.localStorage.getItem(key);

      if (savedStateRaw) {
        try {
          const savedState = JSON.parse(savedStateRaw) as {
            messages?: Array<{ role: "user" | "assistant"; content: string }>;
            selectedModel?: string;
          };

          if (Array.isArray(savedState.messages)) {
            setMessages(savedState.messages.slice(-50));
          }

          if (savedState.selectedModel && models.includes(savedState.selectedModel)) {
            setSelectedModel(savedState.selectedModel);
          }
        } catch {
          window.localStorage.removeItem(key);
        }
      }
    };

    void loadModels();

    return () => {
      active = false;
    };
  }, [supabaseReady]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        messages: messages.slice(-50),
        selectedModel,
      }),
    );
  }, [messages, selectedModel, storageKey]);

  const clearChat = () => {
    setMessages([]);
    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
  };

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
          mode: "agent",
          prompt: trimmed,
        }),
      });

      const data = (await response.json()) as { content?: string; usedModel?: string; error?: string; details?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Local AI request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.content ?? "No response content returned." }]);
      if (data.usedModel) {
        setNotice(`Loaded activated models from your account. Current runtime model: ${data.usedModel}`);
      }
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

  return (
    <div className="min-h-screen bg-[#090b11] text-slate-100">
      <main className="relative flex-1 bg-[#0a0d14] p-5 md:p-8">
          <div className="pointer-events-none absolute right-8 top-8 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="mx-auto max-w-4xl">
            {isAdmin && (
              <div className="mb-4 rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/15 to-slate-900/50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-purple-200/80">Admin</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">Admin Control Center</h2>
                    <p className="mt-1 text-sm text-slate-300">Manage each user's quota directly from here.</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/admin"
                      className="rounded-xl border border-purple-400/30 bg-purple-400/15 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-400/25"
                    >
                      Open Admin Page
                    </Link>
                    <Link
                      href="/admin/quota"
                      className="rounded-xl border border-purple-400/30 bg-purple-400/15 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-400/25"
                    >
                      Manage Quotas
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-400">AI Chat</p>
              <button
                type="button"
                onClick={clearChat}
                className="text-xs text-slate-500 transition hover:text-slate-300"
              >
                Clear chat
              </button>
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
    );
  }
