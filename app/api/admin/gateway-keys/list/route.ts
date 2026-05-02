import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch gateway keys
    const { data: keys, error: keysError } = await supabase
      .from("api_keys")
      .select("id, user_id, key_prefix, allowed_models, is_active, created_at, last_used_at, expires_at")
      .order("created_at", { ascending: false });

    if (keysError) {
      return NextResponse.json({ error: keysError.message }, { status: 400 });
    }

    // Fetch user profiles to join emails
    const userIds = Array.from(new Set(keys.map((k) => k.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const keysWithEmails = keys.map((key) => ({
      ...key,
      email: profiles?.find((p) => p.id === key.user_id)?.email || "Unknown",
    }));

    return NextResponse.json(keysWithEmails);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
