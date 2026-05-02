"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function SettingsPage() {
  const router = useRouter();
  const config = getSupabaseConfig();
  const supabase = useMemo(() => (config ? createClient() : null), [config?.url, config?.anonKey]);

  const [loadingUser, setLoadingUser] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoadingUser(false);
      return;
    }

    let active = true;

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (error) {
        setStatus(error.message);
        setLoadingUser(false);
        return;
      }

      const authUser = data.user;

      if (!authUser) {
        setLoadingUser(false);
        return;
      }

      const nextDisplayName =
        typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name
          : typeof authUser.user_metadata?.name === "string"
            ? authUser.user_metadata.name
            : "";

      setDisplayName(nextDisplayName);
      setEmail(authUser.email ?? "");
      setSignedInEmail(authUser.email ?? "");
      setLoadingUser(false);
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, [supabase]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setStatus("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setSavingProfile(true);
    setStatus("");

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    const { error } = await supabase.auth.updateUser({
      email: trimmedEmail,
      data: {
        full_name: trimmedName,
      },
    });

    if (error) {
      setStatus(error.message);
      setSavingProfile(false);
      return;
    }

    if (trimmedEmail !== signedInEmail) {
      setStatus("Profile updated. Check your inbox to confirm the new email address if Supabase sends a verification message.");
    } else {
      setStatus("Profile updated successfully.");
    }

    setSignedInEmail(trimmedEmail);
    router.refresh();
    setSavingProfile(false);
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setStatus("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Password confirmation does not match.");
      return;
    }

    setSavingPassword(true);
    setStatus("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(error.message);
      setSavingPassword(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setStatus("Password updated successfully.");
    router.refresh();
    setSavingPassword(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">SN-AI Hub</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Update your profile name, email address, and password.</p>

        {!config && (
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Supabase is not configured yet. Create <span className="font-semibold">.env.local</span> in the project root and add your Supabase URL and anon key.
          </div>
        )}

        {loadingUser ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/90 p-6 text-sm text-slate-400 shadow-xl backdrop-blur-md">
            Loading your account details...
          </div>
        ) : !signedInEmail ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/90 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-semibold text-white">Sign in required</h2>
            <p className="mt-2 text-sm text-slate-400">You need an active session to manage settings.</p>
            <Link href="/auth" className="mt-4 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
              Go to sign in
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <form onSubmit={saveProfile} className="rounded-2xl border border-white/10 bg-black/90 p-6 shadow-xl backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="mt-1 text-sm text-slate-400">This is the standard account information shown across the app.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">User name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
                  />
                </label>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Email changes may require verification depending on your Supabase auth settings.
              </p>

              <button
                type="submit"
                disabled={savingProfile}
                className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </form>

            <form onSubmit={savePassword} className="rounded-2xl border border-white/10 bg-black/90 p-6 shadow-xl backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">Password</h2>
              <p className="mt-1 text-sm text-slate-400">Use a new password for your account sign-in.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">New password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter a new password"
                    className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat the new password"
                    className="w-full rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400"
                  />
                </label>
              </div>

              <p className="mt-4 text-xs text-slate-500">Passwords are managed by Supabase Auth and are never stored in app tables.</p>

              <button
                type="submit"
                disabled={savingPassword}
                className="mt-5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
              >
                {savingPassword ? "Updating..." : "Update password"}
              </button>
            </form>

            {status && (
              <div className="rounded-2xl border border-white/10 bg-black/90 p-4 text-sm text-slate-300 shadow-xl backdrop-blur-md">
                {status}
              </div>
            )}
          </div>
        )}
      </div>
  );
}