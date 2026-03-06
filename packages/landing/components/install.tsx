"use client";

import { useState } from "react";

const mcpConfig = `{
  "mcpServers": {
    "memex": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "memex-mcp", "serve"]
    }
  }
}`;

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
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Get Started
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Up and running in 3 commands
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {/* Step 1: Install command */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                1
              </span>
              <h3 className="text-sm font-medium text-white">
                Initialize (encryption + database + agent config)
              </h3>
            </div>
            <div className="group relative overflow-x-auto rounded-xl border border-white/5 bg-[#111111] p-5">
              <pre className="font-mono text-sm text-gray-300">
                <span className="text-gray-500">$ </span>npx memex-mcp init
              </pre>
              <button
                onClick={() => copy("npx memex-mcp init", setCopiedCmd)}
                className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-400 opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
              >
                {copiedCmd ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Generates your encryption key, creates the database, registers with
              Claude Code, and adds Memex instructions to your CLAUDE.md — all in one command.
            </p>
          </div>

          {/* Step 2: Demo */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                2
              </span>
              <h3 className="text-sm font-medium text-white">
                Verify it works (30 seconds)
              </h3>
            </div>
            <div className="group relative overflow-x-auto rounded-xl border border-white/5 bg-[#111111] p-5">
              <pre className="font-mono text-sm text-gray-300">
                <span className="text-gray-500">$ </span>memex demo
              </pre>
              <button
                onClick={() => copy("memex demo", setCopiedConfig)}
                className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-400 opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
              >
                {copiedConfig ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Saves a test memory, encrypts it, recalls it by search, and cleans up.
              Proof that E2E encryption works on your machine.
            </p>
          </div>

          {/* Step 3: Seed */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                3
              </span>
              <h3 className="text-sm font-medium text-white">
                Pre-load your project context
              </h3>
            </div>
            <div className="group relative overflow-x-auto rounded-xl border border-white/5 bg-[#111111] p-5">
              <pre className="font-mono text-sm text-gray-300">
                <span className="text-gray-500">$ </span>memex seed
              </pre>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Scans your codebase (package.json, README, CLAUDE.md, project structure) and
              creates starter memories. Your agent has context from day one.
            </p>
          </div>

          {/* Cursor note */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-6 py-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-purple-400">
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
