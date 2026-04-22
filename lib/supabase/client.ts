import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
  }

  return createBrowserClient(
    config.url,
    config.anonKey,
  );
}
