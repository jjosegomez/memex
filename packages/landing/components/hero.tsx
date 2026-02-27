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
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          Open Source &middot; MIT License
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
          Your AI agents
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            finally remember.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mt-6 text-lg leading-8 text-gray-400 sm:text-xl">
          Portable, E2E encrypted memory for your AI coding agents.
          <br className="hidden sm:inline" /> Works with Claude Code, Cursor, and
          any MCP-compatible tool.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Install command */}
          <button
            onClick={copyCommand}
            className="group relative flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-mono text-sm text-gray-200 transition hover:border-white/20 hover:bg-white/10"
          >
            <span className="text-gray-500">$</span>
            <span>npx memex-mcp init</span>
            <span className="ml-2 text-xs text-gray-500 transition group-hover:text-gray-300">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/juanjgomezme/memex"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
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
