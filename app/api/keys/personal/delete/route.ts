import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyId } = await request.json().catch(() => ({}));

  if (!keyId) {
    return NextResponse.json({ error: "keyId is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("user_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete personal key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
