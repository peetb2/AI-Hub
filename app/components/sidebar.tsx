"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function Sidebar({ initialUserRole }: { initialUserRole?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(initialUserRole ?? null);

  const config = getSupabaseConfig();
  const supabase = config ? createClient() : null;

  const isAdminAuthUser = (user: any) => {
    return user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  };

  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "AI Chat", href: "/code-assistant" },
    { label: "API Keys", href: "/api-keys" },
    { label: "Settings", href: "/settings" },
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

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    const loadUserRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          return;
        }

        if (isAdminAuthUser(user)) {
          if (active) {
            setUserRole("admin");
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Failed to load profile:", profileError);
          return;
        }

        if (!profile) {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email ?? "",
            role: "admin",
            monthly_token_quota: 100000,
          });

          if (insertError) {
            console.warn("Failed to bootstrap admin profile:", insertError);
            return;
          }

          if (active) {
            setUserRole("admin");
          }

          return;
        }

        if (active) {
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error("Failed to load user role:", error);
      }
    };

    void loadUserRole();

    return () => {
      active = false;
    };
  }, [supabase]);

  if (pathname?.startsWith("/main-menu")) return null;

  const handleSignOut = async () => {
    setIsLoading(true);

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-white/10 bg-black/95">
      <div className="border-b border-white/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">SN-AI HUB</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Workspace</h1>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-4 py-2 text-sm transition ${
              isActive(item.href)
                ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {/* Admin links removed intentionally */}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-6">
        <div className="px-4 text-xs text-slate-500">
          <span className="font-semibold text-emerald-300">Free Plan</span>
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
