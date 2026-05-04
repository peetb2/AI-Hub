"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GlassNavbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 ${
      scrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
    }`}>
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push("/")}>
          <div className="h-8 w-8 shrink-0 flex items-center justify-center transition-all group-hover:scale-105">
            <img src="/StartNow_logo.png" alt="StartNow Logo" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white hidden sm:block">SN-Ai<span className="text-cyan-400"> Hub</span></span>
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden md:flex items-center gap-4 border-r border-white/10 pr-6">
              <span className="text-xs font-medium text-slate-400">{user.email}</span>
            </div>
          )}
          
          {user ? (
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition disabled:opacity-50"
            >
              {isLoading ? "..." : "Sign Out"}
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-cyan-400"
            >
              Access Hub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
