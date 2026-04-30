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
      <body className="min-h-full flex flex-col bg-black text-slate-100">
        {showSidebar && <Sidebar initialUserRole={initialUserRole} />}
        {initialUserRole === "admin" && (
          <Link
            href="/admin"
            className="fixed bottom-6 right-6 z-[60] rounded-full border border-purple-400/40 bg-purple-500/90 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-400"
          >
            Admin Page
          </Link>
        )}
        <main className={showSidebar ? "ml-56 flex-1" : "flex-1"}>{children}</main>
      </body>
    </html>
  );
}
