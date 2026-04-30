import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/gateway/apiKeys";
import KeyCenterPanel from "./components/key-center-panel";
import TokenQuotaPanel from "./components/token-quota-panel";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileRole: string | null = null;

  if (user) {
    try {
      const serviceSupabase = createServiceRoleClient();
      const { data: adminProfile } = await serviceSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      profileRole = adminProfile?.role ?? null;
    } catch {
      const { data: sessionProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      profileRole = sessionProfile?.role ?? null;
    }
  }

  const isAdmin =
    profileRole === "admin" ||
    user?.user_metadata?.role === "admin" ||
    user?.app_metadata?.role === "admin";

  return (
    <div
      className="min-h-screen text-slate-100"
      style={{
        backgroundColor: "#696969",
        backgroundImage: "url('/topography.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "600px 600px",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">SN-AI Hub</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Workspace Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Manage your workspace and token quota.</p>
        </header>

        <div className="space-y-6">
          {isAdmin && (
            <div className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/15 to-slate-900/40 p-5 shadow-lg shadow-purple-950/20">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-purple-200/80">Admin</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Control Center</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Open the quota manager to edit each user's monthly limit.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-xl border border-purple-400/30 bg-purple-400/15 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-400/25"
                >
                  Open Admin Page
                </Link>
              </div>
            </div>
          )}

          <TokenQuotaPanel />
          <KeyCenterPanel />
        </div>
      </div>

      {/* (Main Menu button removed; navbar already contains a link) */}
    </div>
  );
}