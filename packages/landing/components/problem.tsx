const painPoints = [
  {
    icon: "🧠",
    title: "Your agent forgets everything",
    description:
      "Every new session starts from zero. That auth pattern you explained 3 times? Gone. The migration strategy you spent 20 minutes on? Gone.",
  },
  {
    icon: "🔒",
    title: "Memories are siloed",
    description:
      "Claude Code memories don't work in Cursor. Switch tools and you lose everything you've built up.",
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
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            The Problem
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI agents have amnesia
          </p>
        </div>

        {/* Pain point cards */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-8 transition hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="text-3xl">{point.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Solution statement */}
        <div className="mt-16 text-center">
          <div className="inline-block rounded-2xl border border-blue-500/20 bg-blue-500/5 px-8 py-6">
            <p className="text-xl font-semibold text-white sm:text-2xl">
              Memex gives your AI agents a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                shared, encrypted brain.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
