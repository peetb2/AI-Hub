import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiKeyRecord } from "@/lib/gateway/apiKeys";

type RedeemRequest = {
  model?: string;
  personalKey?: string;
  expiresInDays?: number | null;
};

const modelAliases: Record<string, string> = {
  "glm flash 4.7": "glm-4.7-flash",
  "glm-4.7-flash": "glm-4.7-flash",
  "qwen 3.5": "qwen3.5",
  "qwen3.5": "qwen3.5",
};

function normalizeModelName(name: string) {
  return modelAliases[name.toLowerCase().trim()] ?? name.trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as RedeemRequest;
  const model = normalizeModelName(body.model ?? "");
  const personalKey = body.personalKey?.trim() ?? "";

  if (!model) {
    return NextResponse.json({ error: "model is required" }, { status: 400 });
  }

  if (!personalKey) {
    return NextResponse.json({ error: "personalKey is required" }, { status: 400 });
  }

  const { data: userModelKey, error: keyError } = await supabase
    .from("user_keys")
    .select("key_value, revoked_at, expires_at")
    .eq("user_id", user.id)
    .eq("key_name", model)
    .maybeSingle<{ key_value: string; revoked_at: string | null; expires_at: string | null }>();

  if (keyError) {
    return NextResponse.json({ error: `Unable to validate personal key: ${keyError.message}` }, { status: 500 });
  }

  if (!userModelKey) {
    return NextResponse.json({ error: "No saved key found for this model" }, { status: 404 });
  }

  if (userModelKey.revoked_at) {
    return NextResponse.json({ error: "This personal key has been revoked" }, { status: 400 });
  }

  if (userModelKey.expires_at && new Date(userModelKey.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This personal key has expired" }, { status: 400 });
  }

  if (userModelKey.key_value !== personalKey) {
    return NextResponse.json({ error: "Personal key does not match saved key for this model" }, { status: 400 });
  }

  const parsedDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
  const expiresAt = parsedDays && parsedDays > 0
    ? new Date(Date.now() + parsedDays * 86400000).toISOString()
    : null;

  try {
    const apiKey = await createApiKeyRecord({
      userId: user.id,
      allowedModel: model,
      expiresAt,
    });

    return NextResponse.json({
      id: apiKey.id,
      key: apiKey.plainKey,
      allowedModel: apiKey.allowed_model,
      createdAt: apiKey.created_at,
      expiresAt: apiKey.expires_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to redeem API key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
