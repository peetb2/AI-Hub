import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/gateway/apiKeys";
import Sidebar from "./components/sidebar";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SN-AI Hub | AI Model Access",
  description: "Select AI models, generate purchase keys, and unlock workspace access.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const initialUserRole =
    profileRole ?? user?.user_metadata?.role ?? user?.app_metadata?.role ?? null;
  const showSidebar = !!user;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0d0f14] text-slate-100">
        {/* Global Background Layer */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#0d0f14]">
          {/* Base Topography Texture */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: "url('/topography.svg')",
              backgroundRepeat: "repeat",
              backgroundSize: "600px 600px",
              filter: "invert(1) brightness(0.6)",
            }}
          />

          {/* Modern Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />

          {/* Subtle Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0f14]/80" />
        </div>

        <div className="relative z-10 flex flex-1">
          {showSidebar && <Sidebar initialUserRole={initialUserRole} />}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
