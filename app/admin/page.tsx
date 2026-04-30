"use client";

import Link from "next/link";

const adminCards = [
  {
    title: "User Quota Manager",
    description: "Adjust each user's monthly token quota, review usage, and block overages.",
    href: "/admin/quota",
    accent: "from-purple-500/20 to-fuchsia-500/10 border-purple-400/30",
  },
  {
    title: "API Token Manager",
    description: "Review and revoke user API keys and gateway access tokens.",
    href: "/admin/tokens",
    accent: "from-emerald-500/20 to-cyan-500/10 border-emerald-400/30",
  },
];

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Control Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Manage per-user quotas, inspect usage, and control token access from one place.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {adminCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`rounded-2xl border bg-gradient-to-br p-6 transition hover:-translate-y-0.5 hover:border-white/20 ${card.accent}`}
            >
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{card.description}</p>
              <div className="mt-5 inline-flex rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/70">
                Open panel
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}