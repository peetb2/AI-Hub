"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const config = getSupabaseConfig();
  const supabase = config ? createClient() : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!supabase) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Signed in successfully. Redirecting...");
    router.push("/");
    router.refresh();
    setLoading(false);
  };

  const signUp = async () => {
    if (!supabase) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage("Sign-up complete. Check your email to confirm your account.");
    } else {
      setMessage("Account created and signed in. Redirecting...");
      router.push("/");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c111c] p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">SN-AI Hub</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sign In Or Sign Up</h1>
        <p className="mt-2 text-sm text-slate-400">Authenticate with Supabase to access your workspace.</p>

        {!config && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            Supabase is not configured yet. Create <span className="font-semibold">.env.local</span> in the project root and add your Supabase URL and anon key.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-white/20 bg-[#080b12] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-white/20 bg-[#080b12] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={signIn}
            disabled={loading || !supabase}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            Sign In
          </button>
          <button
            onClick={signUp}
            disabled={loading || !supabase}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
          >
            Sign Up
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-lg border border-white/10 bg-[#111723] px-3 py-2 text-sm text-slate-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
