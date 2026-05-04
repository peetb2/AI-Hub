import { NextRequest, NextResponse } from 'next/server';
import { bearerTokenFromAuthHeader, validateApiKey, logApiKeyUsage, touchApiKeyLastUsed } from '@/lib/gateway/apiKeys';
import { trackTokenUsage } from '@/lib/tokenUsage';
import { enforceCodingGuardrail } from '@/lib/guardrails';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
};

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
    const { model, messages, ...rest } = body;

    // Apply coding guardrail to messages
    const processedMessages: ChatMessage[] = [...(messages || [])];
    const systemMessageIndex = processedMessages.findIndex((m: ChatMessage) => m.role === 'system');

    if (systemMessageIndex !== -1) {
      processedMessages[systemMessageIndex].content = enforceCodingGuardrail(processedMessages[systemMessageIndex].content);
    } else {
      processedMessages.unshift({
        role: 'system',
        content: enforceCodingGuardrail()
      });
    }

    // Check if requested model matches allowed models
    if (!validated.allowedModels.includes(model)) {
      console.error("❌ Model not allowed:", model, "allowed:", validated.allowedModels);
      return NextResponse.json({ error: { message: "Model not allowed for this API key", type: "invalid_request_error" } }, { status: 403 });
    }

    // NEW SECURITY CHECK: Verify individual model expiration from user_access table
    const { data: currentAccess, error: accessError } = await (await import('@/lib/supabase/server')).createClient().then(s => s
      .from("user_access")
      .select("expires_at")
      .eq("user_id", validated.userId)
      .eq("model_name", model)
      .maybeSingle()
    );

    if (accessError || !currentAccess || new Date(currentAccess.expires_at).getTime() < Date.now()) {
      console.error("❌ Access expired for model:", model);
      return NextResponse.json({ error: { message: "Access for this model has expired. Please reactivate with a new license key.", type: "access_expired" } }, { status: 403 });
    }

    const baseUrl = process.env.LOCAL_AI_BASE_URL ?? "http://localhost:11434/v1";

    const ollamaResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...rest, model: `${model}:latest`, messages: processedMessages }),
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

    const responseClone = ollamaResponse.clone();
    const responseText = await responseClone.text();

    // Log successful usage
    await logApiKeyUsage({ apiKeyId: validated.id, model, statusCode: 200 });

    await trackTokenUsage(
      validated.userId,
      JSON.stringify(rest).length + responseText.length,
      'api-gateway',
    );

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