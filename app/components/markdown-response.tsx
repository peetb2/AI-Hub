"use client";

import { useState } from "react";

interface MarkdownResponseProps {
  content: string;
}

export function MarkdownResponse({ content }: MarkdownResponseProps) {
  // Regex to match code blocks: ```language\ncode\n```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4">
      {parts.filter(Boolean).map((part, index) => {
        if (part.startsWith("```")) {
          // Extract language and code
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const lang = match?.[1] || "code";
          const code = match?.[2] || "";

          return <CodeBlock key={index} language={lang} code={code.trim()} />;
        }

        // Return regular text parts
        return (
          <div key={index} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </div>
        );
      })}
    </div>
  );
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d0f14] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="text-sm font-mono text-slate-300 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
