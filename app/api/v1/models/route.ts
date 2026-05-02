import { NextResponse } from "next/server";
import { bearerTokenFromAuthHeader, validateApiKey } from "@/lib/gateway/apiKeys";

export async function GET(request: Request) {
  const token = bearerTokenFromAuthHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: { message: "Missing bearer token", type: "invalid_request_error" } }, { status: 401 });
  }

  const validated = await validateApiKey(token);

  if (!validated) {
    return NextResponse.json({ error: { message: "Invalid API key", type: "authentication_error" } }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const models = (validated.allowedModels || []).map(m => ({
    id: m,
    object: "model",
    created: now,
    owned_by: "matcha-ai-hub",
  }));

  return NextResponse.json({
    object: "list",
    data: models,
  });
}
