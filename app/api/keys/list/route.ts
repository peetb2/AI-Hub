import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listApiKeysForUser } from "@/lib/gateway/apiKeys";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await listApiKeysForUser(user.id);
    return NextResponse.json({ keys });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list API keys";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
