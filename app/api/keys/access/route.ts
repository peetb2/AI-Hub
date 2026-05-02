import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("user_access")
      .select("model_name, expires_at")
      .eq("user_id", user.id);

    if (error) throw error;

    const now = new Date().getTime();
    const activeAccess = (data ?? []).filter(a => new Date(a.expires_at).getTime() > now);

    return NextResponse.json(activeAccess);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch access" }, { status: 500 });
  }
}
