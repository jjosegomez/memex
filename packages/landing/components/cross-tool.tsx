export function CrossTool() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#919191]">
            Portability
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-[#e5e2e1] sm:text-4xl">
            Save in one tool. Recall in another.
          </p>
        </div>

        {/* Three connected panels */}
        <div className="mt-16 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {/* Panel 1 — Claude Code */}
          <div className="rounded-md bg-[#1c1b1b] p-6">
            <div className="flex items-center gap-2 mb-4">
              {/* Terminal icon */}
              <svg className="h-5 w-5 text-[#919191]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021.75 18V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25z" />
              </svg>
              <span className="text-sm font-semibold text-[#e5e2e1]">Claude Code</span>
            </div>
            <div className="rounded-md bg-[#0e0e0e] p-4">
              <pre className="font-[family-name:var(--font-space-grotesk)] text-xs leading-5 text-[#c6c6c6] whitespace-pre-wrap">
                <code>{`save_memory(
  "API uses REST with
   /api/v1 prefix..."
)`}</code>
              </pre>
            </div>
          </div>

          {/* Arrow (right on desktop, down on mobile) */}
          <div className="flex justify-center lg:flex-col lg:items-center">
            {/* Mobile arrow (down) */}
            <svg className="h-6 w-6 text-[#22c55e] lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {/* Desktop arrow (right) */}
            <svg className="hidden lg:block h-6 w-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>

          {/* Panel 2 — Memex (highlighted hub) */}
          <div className="rounded-md border border-[#22c55e]/20 bg-[#1c1b1b] p-6">
            <div className="flex items-center gap-2 mb-4">
              {/* Lock icon */}
              <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-sm font-semibold text-[#e5e2e1]">Memex</span>
            </div>
            <div className="rounded-md bg-[#0e0e0e] p-4">
              <pre className="font-[family-name:var(--font-space-grotesk)] text-xs leading-5 text-[#c6c6c6] whitespace-pre-wrap">
                <code>{`{
  content: encrypted,
  tags: ["api", "arch"],
  project: "my-app"
}`}</code>
              </pre>
            </div>
            <p className="mt-3 text-center text-xs text-[#22c55e]/60 font-[family-name:var(--font-space-grotesk)]">
              encrypted &middot; local
            </p>
          </div>

          {/* Arrow (right on desktop, down on mobile) */}
          <div className="flex justify-center lg:flex-col lg:items-center">
            {/* Mobile arrow (down) */}
            <svg className="h-6 w-6 text-[#22c55e] lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {/* Desktop arrow (right) */}
            <svg className="hidden lg:block h-6 w-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>

          {/* Panel 3 — Cursor */}
          <div className="rounded-md bg-[#1c1b1b] p-6">
            <div className="flex items-center gap-2 mb-4">
              {/* Cursor/editor icon */}
              <svg className="h-5 w-5 text-[#919191]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              <span className="text-sm font-semibold text-[#e5e2e1]">Cursor</span>
            </div>
            <div className="rounded-md bg-[#0e0e0e] p-4">
              <pre className="font-[family-name:var(--font-space-grotesk)] text-xs leading-5 text-[#c6c6c6] whitespace-pre-wrap">
                <code>{`recall_memories(
  "API conventions"
)
→ "API uses REST with
    /api/v1 prefix..."`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* One-liner */}
        <p className="mt-12 text-center text-sm text-[#919191]">
          Same memory. Any MCP-compatible tool. No copy-pasting. No config files to maintain.
        </p>
      </div>
    </section>
  );
}
