const steps = [
  {
    number: "01",
    title: "Install in 10 seconds",
    description: "One command registers the MCP server with your AI tool.",
    code: `$ npx memex-mcp init

✔ Generated encryption key
✔ Created database
✔ Registered with Claude Code

Ready. Your agent now has memory.`,
  },
  {
    number: "02",
    title: "Your agent saves context automatically",
    description:
      "When your agent learns something important, it stores it as an encrypted memory.",
    code: `// Agent calls save_memory tool
{
  "tool": "save_memory",
  "arguments": {
    "content": "Auth uses Clerk with JWT. Protected routes
      go through middleware.ts. API routes
      verify via getAuth().",
    "tags": ["auth", "architecture"]
  }
}`,
  },
  {
    number: "03",
    title: "Context persists everywhere",
    description:
      "Next session, different tool — memories are always there.",
    code: `// Agent calls recall_memories tool
{
  "tool": "recall_memories",
  "arguments": {
    "query": "how does auth work in this project?"
  }
}

// Returns the saved memory — encrypted at rest,
// decrypted only on your machine.`,
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
            Three steps to persistent memory
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
