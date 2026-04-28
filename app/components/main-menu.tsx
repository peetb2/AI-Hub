"use client";

import Link from "next/link";
import Aurora from "./aurora";
import GlassNavbar from "./glass-navbar";

export default function MainMenu() {
  return (
    <section className="fixed inset-0 z-0">
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full">
          <Aurora />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
      </div>

      <GlassNavbar />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24 text-center">
        <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">Access Powerful AI,<br/>Instantly</h1>
        <p className="mt-4 text-lg text-slate-200">Manage personal keys, generate API credentials, and unlock seamless access to advanced AI models for your workspace.</p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/code-assistant" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:opacity-90">Get started</Link>
          <Link href="#learn-more" className="rounded-full border border-white/20 px-6 py-3 text-sm text-slate-200 hover:bg-white/5">Learn more</Link>
        </div>
      </div>
    </section>
  );
}
