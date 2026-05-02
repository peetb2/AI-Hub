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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const config = getSupabaseConfig();
  const supabase = config ? createClient() : null;

  const navItems = [
    { 
      label: "Dashboard", 
      href: "/", 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    },
    { 
      label: "AI Chat", 
      href: "/code-assistant",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/><circle cx="17" cy="7" r="5"/><path d="M11 21a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/></svg>
    },
    { 
      label: "Settings", 
      href: "/settings",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    },
  ];

  if (initialUserRole === "admin") {
    navItems.push({
      label: "Admin",
      href: "/admin",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
    });
  }

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
      if (supabase) await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Spacer to push main content when expanded */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"} hidden lg:block`} />

      <aside className={`fixed left-0 top-0 z-[100] flex h-screen flex-col border-r border-white/5 bg-black/80 backdrop-blur-2xl transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#111318] text-slate-400 transition hover:text-white"
        >
          <svg className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        {/* Logo Section */}
        <div className={`flex items-center gap-3 border-b border-white/5 px-6 py-8 transition-all ${isCollapsed ? "justify-center px-0" : ""}`}>
          <div className="h-8 w-8 shrink-0 flex items-center justify-center transition-all">
            <img src="/StartNow_logo.png" alt="StartNow Logo" className="h-full w-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 leading-none">AI Hub</p>
              <h1 className="text-sm font-bold text-white tracking-tight mt-0.5">Workspace</h1>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.05)] border border-cyan-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <div className={`shrink-0 transition-transform ${isActive(item.href) ? "scale-110" : "group-hover:scale-110"}`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="text-sm font-bold tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={`mt-auto space-y-3 border-t border-white/5 p-4 transition-all ${isCollapsed ? "items-center px-0" : ""}`}>
          {!isCollapsed && (
             <div className="px-4 mb-4">
                <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-3 border border-emerald-500/20">
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Current Plan</p>
                   <p className="text-xs font-bold text-white mt-0.5">Standard Node</p>
                </div>
             </div>
          )}

          <div className={`flex flex-col gap-2 ${isCollapsed ? "items-center" : ""}`}>
            <button
              onClick={() => router.push("/main-menu")}
              title="Main Menu"
              className={`flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 ${isCollapsed ? "justify-center px-0 w-12" : "w-full"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              {!isCollapsed && <span>Main Menu</span>}
            </button>
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              title="Sign Out"
              className={`flex items-center gap-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50 ${isCollapsed ? "justify-center px-0 w-12" : "w-full"}`}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              )}
              {!isCollapsed && <span>{isLoading ? "Signing Out..." : "Sign Out"}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
