const steps = [
  {
    number: "01",
    title: "Install in 10 seconds",
    description: "One command sets up encryption, database, Claude Code integration, and agent instructions.",
    code: `$ npx memex-mcp init

Step 1/4: Encryption Setup
  Generated random encryption key.

Step 2/4: Database
  Database created and schema initialized.

Step 3/4: Claude Code Integration
  Added memex MCP server to Claude Code settings.

Step 4/4: Agent Instructions
  Created CLAUDE.md with Memex instructions.

Setup complete! Memex is ready.`,
  },
  {
    number: "02",
    title: "Verify it works, seed your project",
    description:
      "Run a 30-second demo to see encryption in action, then pre-load your project context.",
    code: `$ memex demo
  Saved → Encrypted → Recalled → Decrypted ✔

$ memex seed
  Scanning project files...
  Saved: [project-info, stack]
  Saved: [project-info, overview]
  Done! 3 memories saved.

Your agent has project context from day one.`,
  },
  {
    number: "03",
    title: "Your agent remembers automatically",
    description:
      "Your agent saves and recalls context across sessions — no prompting needed.",
    code: `// Agent saves what it learns
save_memory("Auth uses Clerk with JWT.
  Protected routes go through middleware.ts.
  API routes verify via getAuth().",
  tags: ["auth", "architecture"])

// Next session — instant context
recall_memories("how does auth work?")
→ Returns the saved memory, decrypted on your machine.`,
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            How It Works
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Install, verify, start building
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 space-y-16">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              {/* Step number + text */}
              <div className="mb-4 flex items-start gap-4">
                <span className="shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 px-3 py-1 font-mono text-sm font-bold text-white">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Code block */}
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#111111] p-5">
                <pre className="font-mono text-sm leading-6 text-gray-300">
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
