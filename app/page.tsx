import Link from "next/link";
import KeyCenterPanel from "./components/key-center-panel";

export default function Dashboard() {
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
          <p className="mt-2 text-sm text-slate-400">Manage your personal key and jump into the tools you use.</p>
        </header>

        <div className="space-y-6">
          <KeyCenterPanel />
        </div>
      </div>

      {/* (Main Menu button removed; navbar already contains a link) */}
    </div>
  );
}