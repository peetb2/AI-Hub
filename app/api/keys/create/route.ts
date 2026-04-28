import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiKeyRecord } from "@/lib/gateway/apiKeys";

type CreateKeyRequest = {
  model?: string;
  expiresAt?: string | null;
  expiresInDays?: number | null;
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

  const body = (await request.json().catch(() => ({}))) as CreateKeyRequest;
  const model = body.model ?? "glm-4.7-flash";
  const parsedDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
  const expiresAt = body.expiresAt ?? (parsedDays && parsedDays > 0 ? new Date(Date.now() + parsedDays * 86400000).toISOString() : null);

  try {
    const key = await createApiKeyRecord({
      userId: user.id,
      allowedModel: model,
      expiresAt,
    });

    return NextResponse.json({
      id: key.id,
      key: key.plainKey,
      allowedModel: key.allowed_model,
      createdAt: key.created_at,
      expiresAt: key.expires_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create API key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
