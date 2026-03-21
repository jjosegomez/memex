"use client";

import { useState } from "react";

export function Install() {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#919191]">
            Get Started
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-[#e5e2e1] sm:text-4xl">
            Up and running in 3 commands
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {/* Step 1: Install command */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#22c55e]/10 font-[family-name:var(--font-space-grotesk)] text-xs font-bold text-[#22c55e]">
                1
              </span>
              <h3 className="text-sm font-medium text-[#e5e2e1]">
                Initialize (encryption + database + agent config)
              </h3>
            </div>
            <div className="group relative overflow-x-auto rounded-md bg-[#0e0e0e] p-5">
              <pre className="font-[family-name:var(--font-space-grotesk)] text-sm text-[#c6c6c6]">
                <span className="text-[#919191]">$ </span>npx memex-mcp init
              </pre>
              <button
                onClick={() => copy("npx memex-mcp init", setCopiedCmd)}
                className="absolute right-3 top-3 rounded-md bg-[#2a2a2a] px-2 py-1 text-xs text-[#919191] opacity-0 transition hover:bg-[#353534] group-hover:opacity-100"
              >
                {copiedCmd ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#919191]">
              Generates your encryption key, creates the database, registers with
              Claude Code, and adds Memex instructions to your CLAUDE.md — all in one command.
            </p>
          </div>

          {/* Step 2: Demo */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#22c55e]/10 font-[family-name:var(--font-space-grotesk)] text-xs font-bold text-[#22c55e]">
                2
              </span>
              <h3 className="text-sm font-medium text-[#e5e2e1]">
                Verify it works (30 seconds)
              </h3>
            </div>
            <div className="group relative overflow-x-auto rounded-md bg-[#0e0e0e] p-5">
              <pre className="font-[family-name:var(--font-space-grotesk)] text-sm text-[#c6c6c6]">
                <span className="text-[#919191]">$ </span>memex demo
              </pre>
              <button
                onClick={() => copy("memex demo", setCopiedConfig)}
                className="absolute right-3 top-3 rounded-md bg-[#2a2a2a] px-2 py-1 text-xs text-[#919191] opacity-0 transition hover:bg-[#353534] group-hover:opacity-100"
              >
                {copiedConfig ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#919191]">
              Saves a test memory, encrypts it, recalls it by search, and cleans up.
              Proof that E2E encryption works on your machine.
            </p>
          </div>

          {/* Step 3: Seed */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#22c55e]/10 font-[family-name:var(--font-space-grotesk)] text-xs font-bold text-[#22c55e]">
                3
              </span>
              <h3 className="text-sm font-medium text-[#e5e2e1]">
                Pre-load your project context
              </h3>
            </div>
            <div className="group relative overflow-x-auto rounded-md bg-[#0e0e0e] p-5">
              <pre className="font-[family-name:var(--font-space-grotesk)] text-sm text-[#c6c6c6]">
                <span className="text-[#919191]">$ </span>memex seed
              </pre>
            </div>
            <p className="mt-2 text-xs text-[#919191]">
              Scans your codebase (package.json, README, CLAUDE.md, project structure) and
              creates starter memories. Your agent has context from day one.
            </p>
          </div>

          {/* Cursor note */}
          <div className="rounded-md bg-[#1c1b1b] px-6 py-4">
            <p className="text-sm text-[#c6c6c6]">
              <span className="font-semibold text-[#22c55e]">
                Works with Cursor too.
              </span>{" "}
              Add the same MCP config to your Cursor settings. Any MCP-compatible
              tool can connect to Memex.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
