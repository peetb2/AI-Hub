import { NextRequest, NextResponse } from 'next/server';
import { bearerTokenFromAuthHeader, validateApiKey, logApiKeyUsage, touchApiKeyLastUsed } from '@/lib/gateway/apiKeys';

export async function POST(req: NextRequest) {
  console.log("🚨 Chat completion request received");

  // Extract and validate API key
  const token = bearerTokenFromAuthHeader(req.headers.get('authorization'));

  if (!token) {
    console.error("❌ Missing bearer token");
    return NextResponse.json({ error: { message: "Missing bearer token", type: "invalid_request_error" } }, { status: 401 });
  }

  const validated = await validateApiKey(token);

  if (!validated) {
    console.error("❌ Invalid API key");
    return NextResponse.json({ error: { message: "Invalid API key", type: "authentication_error" } }, { status: 401 });
  }

  console.log("✅ API key validated for user:", validated.userId);

  try {
    const body = await req.json();
    const { model, ...rest } = body;

    // Check if requested model matches allowed model
    if (model !== validated.allowedModel) {
      console.error("❌ Model not allowed:", model, "allowed:", validated.allowedModel);
      return NextResponse.json({ error: { message: "Model not allowed for this API key", type: "invalid_request_error" } }, { status: 403 });
    }

    const baseUrl = process.env.LOCAL_AI_BASE_URL ?? "http://localhost:11434/v1";

    const ollamaResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...rest, model: `${model}:latest` }),
    });

    // Update last used
    await touchApiKeyLastUsed(validated.id);

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error("❌ Ollama Error:", errorText);
      await logApiKeyUsage({ apiKeyId: validated.id, model, statusCode: ollamaResponse.status });
      return NextResponse.json(
        { error: { message: "Local AI Error", type: "upstream_error" }, details: errorText },
        { status: ollamaResponse.status }
      );
    }

    // Log successful usage
    await logApiKeyUsage({ apiKeyId: validated.id, model, statusCode: 200 });

    // Stream response back
    return new Response(ollamaResponse.body, {
      status: ollamaResponse.status,
      headers: ollamaResponse.headers,
    });

  } catch (error) {
    console.error('🔥 API Gateway Critical Error:', error);
    return NextResponse.json({ error: { message: 'Internal Server Error', type: 'internal_error' } }, { status: 500 });
  }
}