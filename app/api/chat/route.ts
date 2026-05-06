import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canUseTokens, trackTokenUsage } from "@/lib/tokenUsage";
import { CODING_GUARDRAIL_PROMPT } from "@/lib/guardrails";

type ChatRequest = {
  model: string;
  mode?: "agent" | "text";
  prompt: string;
};

const runtimeModelMap: Record<string, string> = {
  "glm-4.7-flash": "glm-4.7-flash:latest",
  "qwen3.5": "qwen3.5:latest",
};

function resolveRuntimeModel(model: string) {
  return runtimeModelMap[model] ?? model;
}

function looksLikeHtmlOrCode(content: string, prompt: string) {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("html") || normalizedPrompt.includes("web page") || normalizedPrompt.includes("website")) {
    return true;
  }

  return /<(!doctype|html|head|body|div|header|main|footer|section|article|style|script|meta|title|h[1-6]|p|a|span|button|input|form|img|ul|ol|li)(\s|>)/i.test(content);
}

function wrapInHtmlFence(content: string) {
  const trimmed = content.trim();

  // If it already starts with a code block or contains any code blocks, don't wrap it again
  if (trimmed.startsWith("```") || trimmed.includes("\n```")) {
    return content;
  }

  return `\`\`\`html\n${trimmed}\n\`\`\``;
}

function getLocalAiBaseUrl() {
  return process.env.LOCAL_AI_BASE_URL ?? "http://localhost:11434/v1";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest>;

  if (!body.model || !body.prompt) {
    return NextResponse.json({ error: "model and prompt are required" }, { status: 400 });
  }

  const baseUrl = getLocalAiBaseUrl();
  const apiKey = process.env.LOCAL_AI_API_KEY;
  const runtimeModel = resolveRuntimeModel(body.model);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const estimatedCharacters = body.prompt.length;

  const hasQuota = await canUseTokens(user.id, estimatedCharacters);

  if (!hasQuota) {
    return NextResponse.json(
      { error: "Monthly token quota reached" },
      { status: 429 },
    );
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: runtimeModel,
        messages: [
          {
            role: "system",
            content:
              body.mode === "agent"
                ? `${CODING_GUARDRAIL_PROMPT}\n\nYou are currently acting as a coding agent. Be concise, practical, and return implementation-ready guidance. When returning code, keep formatting intact and wrap it in fenced code blocks.`
                : `${CODING_GUARDRAIL_PROMPT}\n\nYou are currently acting as a coding assistant. Be concise and directly answer the user's request. When returning code or HTML, keep formatting intact and wrap it in fenced code blocks.`,
          },
          {
            role: "user",
            content: body.prompt,
          },
        ],
        temperature: 0.2,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Local AI request failed: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Local AI returned no message content" }, { status: 502 });
    }

    const formattedContent = looksLikeHtmlOrCode(content, body.prompt) ? wrapInHtmlFence(content) : content;

    await trackTokenUsage(
      user.id,
      body.prompt.length + formattedContent.length,
      body.mode === "agent" ? "code-assistant" : "chat",
    );

    return NextResponse.json({ content: formattedContent, usedModel: runtimeModel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown local AI error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
