"use client";

import { useState } from "react";

export function Hero() {
  const [copied, setCopied] = useState(false);

  function copyCommand() {
    navigator.clipboard.writeText("npx memex-mcp init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-[#22c55e]/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-[#22c55e]/20 bg-[#1c1b1b] px-4 py-1.5 text-sm text-[#c6c6c6]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          Open Source &middot; MIT License
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold tracking-tight text-[#e5e2e1] sm:text-7xl">
          Stop re-explaining
          <br />
          <span className="text-[#22c55e]">
            yourself to every AI tool.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mt-6 text-lg leading-8 text-[#c6c6c6] sm:text-xl">
          Portable, encrypted memory that follows you across AI coding agents.
          <br className="hidden sm:inline" /> Save context in Claude Code, recall it in Cursor.
          One command to install.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Install command — primary CTA */}
          <button
            onClick={copyCommand}
            className="group relative flex items-center gap-3 rounded-md bg-[#22c55e] px-6 py-3.5 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[#131313] shadow-[0_0_60px_rgba(34,197,94,0.06)] transition hover:bg-[#6bff8f]"
          >
            <span className="text-[#131313]/60">$</span>
            <span>npx memex-mcp init</span>
            <span className="ml-2 text-xs text-[#131313]/60 transition group-hover:text-[#131313]/80">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>

          {/* GitHub link — secondary */}
          <a
            href="https://github.com/jjosegomez/memex"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[#474747]/15 px-5 py-3 text-sm text-[#c6c6c6] transition hover:text-[#e5e2e1] hover:bg-[#1c1b1b]"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
