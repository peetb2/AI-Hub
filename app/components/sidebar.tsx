"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "AI Chat", href: "/code-assistant" },
    { label: "API Keys", href: "/api-keys" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("#")[0]);
  };

  useEffect(() => {
    if (pathname?.startsWith("/main-menu")) {
      document.body.classList.add("hide-sidebar");
    } else {
      document.body.classList.remove("hide-sidebar");
    }
  }, [pathname]);

  if (pathname?.startsWith("/main-menu")) return null;

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/auth/signout");
      if (response.ok) {
        // Clear localStorage/sessionStorage if Supabase stores tokens there
        localStorage.clear();
        sessionStorage.clear();
        
        // Hard navigate to auth page to clear all state
        window.location.href = "/auth";
      }
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-white/10 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-semibold">SN-AI HUB</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Workspace</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg text-sm transition ${
              isActive(item.href)
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-6 space-y-3">
        <div className="text-xs text-slate-500 px-4">
          <span className="text-emerald-300 font-semibold">Free Plan</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/main-menu")}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
          >
            Main Menu
          </button>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-400/20 disabled:opacity-50"
          >
            {isLoading ? "..." : "Sign Out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
