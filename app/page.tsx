import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/gateway/apiKeys";
import GatewayKeyPanel from "./components/gateway-key-panel";
import TokenQuotaPanel from "./components/token-quota-panel";
import DashboardMicroStats from "./components/dashboard-micro-stats";
import LicenseActivationPanel from "./components/license-activation-panel";
import LicensePurchasePanel from "./components/license-purchase-panel";
import KeyCenterPanel from "./components/key-center-panel";

async function getAdminStatus(user: any) {
  if (!user) return false;
  try {
    const serviceSupabase = createServiceRoleClient();
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return profile?.role === "admin";
  } catch {
    return false;
  }
}

export default async function DashboardV5() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = await getAdminStatus(user);

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-16">
      {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-cyan-400 rounded-full" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Command Center</p>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Hub <span className="text-slate-500">Overview</span>
            </h1>
          </div>
          
          {isAdmin && (
            <Link
              href="/admin"
              className="group flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 transition hover:bg-purple-500/20 hover:border-purple-500/50"
            >
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Admin Access</span>
                <span className="text-sm font-medium text-white">Open Control Panel</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 transition group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </Link>
          )}
        </header>

        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 text-slate-100">
            <TokenQuotaPanel />
            <DashboardMicroStats />
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          
          {/* Main Area: Marketplace & Gateway Tools */}
          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-6 w-1.5 bg-cyan-500 rounded-full" />
                <h2 className="text-2xl font-bold text-white tracking-tight text-slate-100">Marketplace</h2>
              </div>
              <LicensePurchasePanel />
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-6 w-1.5 bg-blue-500 rounded-full" />
                <h2 className="text-2xl font-bold text-white tracking-tight text-slate-100">Gateway Generator</h2>
              </div>
              <KeyCenterPanel />
            </section>
            
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-6 w-1.5 bg-emerald-500 rounded-full" />
                <h2 className="text-2xl font-bold text-white tracking-tight text-slate-100">Your Access Keys</h2>
              </div>
              <GatewayKeyPanel />
            </section>
          </div>

          {/* Sidebar: Activation & Quick Links */}
          <aside className="space-y-8 sticky top-24">
            <LicenseActivationPanel />

            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl">
               <h3 className="text-lg font-bold text-white mb-4">Navigation</h3>
               <nav className="space-y-2">
                  <Link href="/code-assistant" className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition group text-slate-100">
                    <span className="text-sm font-medium">Open AI Chat</span>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition group text-slate-100">
                    <span className="text-sm font-medium">Account Settings</span>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  </Link>
               </nav>
            </div>
            
            <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Status</p>
                <div className="mt-4 space-y-3">
                   <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Gateway Online</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Auth Nodes Syncing</span>
                   </div>
                </div>
            </div>
          </aside>

        </div>
      </div>
  );
}
