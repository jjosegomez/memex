const painPoints = [
  {
    icon: "🔒",
    title: "Your memories are locked in",
    description:
      "Claude Code memories don't work in Cursor. Cursor memories don't work anywhere else. Switch tools and you start from zero.",
  },
  {
    icon: "🧠",
    title: "Your agent forgets everything",
    description:
      "Every new session starts from zero. That auth pattern you explained 3 times? Gone. The migration strategy you spent 20 minutes on? Gone.",
  },
  {
    icon: "👁️",
    title: "No encryption",
    description:
      "Your code context, architecture notes, and project details sit in plaintext on vendor servers.",
  },
];

export function Problem() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#919191]">
            The Problem
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-[#e5e2e1] sm:text-4xl">
            Your AI memory is trapped
          </p>
        </div>

        {/* Pain point cards */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="rounded bg-[#1c1b1b] p-8 transition hover:bg-[#201f1f]"
            >
              <div className="text-3xl">{point.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-[#e5e2e1]">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#c6c6c6]">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Solution statement */}
        <div className="mt-16 text-center">
          <div className="inline-block rounded-md border border-[#22c55e]/20 bg-[#1c1b1b] px-8 py-6">
            <p className="text-xl font-semibold text-[#e5e2e1] sm:text-2xl">
              Memex gives your AI agents a{" "}
              <span className="text-[#22c55e]">
                portable, encrypted brain.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
