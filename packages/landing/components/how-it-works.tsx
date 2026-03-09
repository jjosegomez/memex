const steps = [
  {
    number: "01",
    title: "One command. That's it.",
    description:
      "Sets up encryption, registers with your AI tools, and auto-imports your existing configs.",
    code: `$ npx memex-mcp init

✓ Encryption key generated
✓ Database created
✓ Claude Code registered
✓ Imported: CLAUDE.md, .cursorrules

Setup complete! Memex is ready.`,
  },
  {
    number: "02",
    title: "Your agent remembers from here.",
    description:
      "No configuration. No manual saving. Your agent learns as you work and recalls what it needs.",
    code: `// Monday — agent learns naturally
save_memory("Auth uses Clerk with JWT.
  Routes go through middleware.ts.",
  tags: ["auth", "architecture"])

// Tuesday — context is already there
recall_memories("auth setup")
→ "Auth uses Clerk with JWT..."`,
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header — centered above both steps */}
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            How It Works
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Two steps. Then forget about it.
          </p>
        </div>

        {/* Steps — each step is a side-by-side row */}
        <div className="mt-16 space-y-24">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12"
            >
              {/* Text side */}
              <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 px-3 py-1 font-mono text-sm font-bold text-white">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code side */}
              <div className={`mt-8 lg:mt-0 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#111111] p-5">
                  <pre className="font-mono text-sm leading-6 text-gray-300">
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
