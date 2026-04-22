import { NextResponse } from "next/server";

type ChatRequest = {
  model: string;
  mode?: "agent" | "text";
  prompt: string;
};

function looksLikeHtmlOrCode(content: string, prompt: string) {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("html") || normalizedPrompt.includes("web page") || normalizedPrompt.includes("website")) {
    return true;
  }

  return /<(!doctype|html|head|body|div|header|main|footer|section|article|style|script|meta|title|h[1-6]|p|a|span|button|input|form|img|ul|ol|li)(\s|>)/i.test(content);
}

function wrapInHtmlFence(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
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

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: body.model,
        messages: [
          {
            role: "system",
            content:
              body.mode === "agent"
                ? "You are a coding agent. Be concise, practical, and return implementation-ready guidance. When returning code, keep formatting intact and wrap it in fenced code blocks."
                : "You are a coding assistant. Be concise and directly answer the user's request. When returning code or HTML, keep formatting intact and wrap it in fenced code blocks.",
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

    return NextResponse.json({ content: formattedContent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown local AI error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}