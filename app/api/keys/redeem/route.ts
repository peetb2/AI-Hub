import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiKeyRecord } from "@/lib/gateway/apiKeys";

type RedeemRequest = {
  models?: string[];
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
  const models = (body.models || []).map(m => normalizeModelName(m));

  if (models.length === 0) {
    return NextResponse.json({ error: "At least one model must be selected" }, { status: 400 });
  }

  // NEW HUB LOGIC: Check user_access instead of user_keys
  const { data: userAccess, error: accessError } = await supabase
    .from("user_access")
    .select("model_name, expires_at")
    .eq("user_id", user.id)
    .in("model_name", models);

  if (accessError) {
    return NextResponse.json({ error: `Unable to validate access: ${accessError.message}` }, { status: 500 });
  }

  const foundModelNames = (userAccess || []).map(a => a.model_name);
  const missingModels = models.filter(m => !foundModelNames.includes(m));

  if (missingModels.length > 0) {
    return NextResponse.json({ 
      error: `You haven't activated access for: ${missingModels.join(", ")}` 
    }, { status: 404 });
  }

  // Validate all requested models are still active (not expired)
  const now = Date.now();
  for (const access of userAccess || []) {
    if (new Date(access.expires_at).getTime() < now) {
      return NextResponse.json({ error: `Access for ${access.model_name} has expired. Please buy a new license key.` }, { status: 400 });
    }
  }

  try {
    const apiKey = await createApiKeyRecord({
      userId: user.id,
      allowedModels: models,
      expiresAt: null, // No separate expiration for the gateway key
    });

    return NextResponse.json({
      id: apiKey.id,
      key: apiKey.plainKey,
      allowedModels: apiKey.allowed_models,
      createdAt: apiKey.created_at,
      expiresAt: apiKey.expires_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to redeem API key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
