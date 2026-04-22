import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    const url = new URL("/auth?setup=1", request.url);
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/auth", request.url);
  return NextResponse.redirect(url);
}
