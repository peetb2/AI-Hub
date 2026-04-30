"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GlassNavbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setUserRole(null);
        return;
      }

      if (user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin") {
        setUserRole("admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setUserRole(profile?.role ?? null);
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push("/auth");
  };

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/10 border border-white/30 rounded-full px-8 py-3 flex items-center justify-between gap-12 min-w-fit max-w-4xl">
      <div className="flex items-center gap-8">
        {/* Left: SN AI Hub */}
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-semibold">SN-AI HUB</p>
        </div>

        {/* Center: Nav items (optional) */}
        <div className="hidden md:flex gap-6 text-sm text-slate-300">
          <button className="hover:text-white transition">About</button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 hidden lg:block" />

      {/* Right: Auth buttons */}
      <div className="flex items-center gap-3">
        {/* Admin buttons removed */}
        {user ? (
          <>
            <span className="text-sm text-slate-300 hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-red-200 border border-red-400/30 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition disabled:opacity-50"
            >
              {isLoading ? "..." : "Sign Out"}
            </button>
          </>
        ) : (
          <button
            onClick={handleSignIn}
            className="px-4 py-2 text-sm font-medium text-white bg-white text-black rounded-full hover:bg-slate-100 transition font-semibold"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
