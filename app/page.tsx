import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">SN-AI Hub</p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Workspace Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              Practical control panel for launching workspace tasks and managing access.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/auth/signout"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Sign Out
            </Link>
            <Link
              href="/code-assistant"
              className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-300/20"
            >
              Open Workspace
            </Link>
            <Link
              href="/key-center"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Manage Keys
            </Link>
            <Link
              href="/api-keys"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              API Keys
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0c111c] p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-slate-400">Quick Actions</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link
                href="/code-assistant"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Start New Session
              </Link>
              <Link
                href="/key-center"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Generate Access Key
              </Link>
              <Link
                href="/api-keys"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Create Continue Key
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c111c] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-semibold text-white">Online</p>
            <p className="mt-1 text-sm text-slate-400">System healthy</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c111c] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Plan</p>
            <p className="mt-2 text-2xl font-semibold text-white">Free</p>
            <p className="mt-1 text-sm text-slate-400">1 workspace active</p>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0c111c] p-6 md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-slate-400">Workspace Summary</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">AI Chat</h2>
            <p className="mt-1 text-xs text-slate-400">Supported models: glm flash 4.7, qwen 3.5</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Use this workspace for bug fixing, code edits, architecture checks, and guided implementation.
            </p>
            <div className="mt-5 flex gap-2">
              <Link
                href="/code-assistant"
                className="rounded-lg border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-300/20"
              >
                Enter Workspace
              </Link>
              <Link
                href="/key-center"
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Open Key Center
              </Link>
              <Link
                href="/api-keys"
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Open API Keys
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c111c] p-6">
            <p className="text-xs uppercase tracking-wider text-slate-400">Recent Activity</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Last key generated: Today</li>
              <li>Last session: Active</li>
              <li>Mode: Agent</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}