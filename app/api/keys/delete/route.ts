import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteApiKeyForUser } from "@/lib/gateway/apiKeys";

type DeleteRequest = {
  keyId?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DeleteRequest;

  if (!body.keyId) {
    return NextResponse.json({ error: "keyId is required" }, { status: 400 });
  }

  try {
    await deleteApiKeyForUser(user.id, body.keyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete API key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
