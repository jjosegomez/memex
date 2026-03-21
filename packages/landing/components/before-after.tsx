"use client";

const tools = [
  {
    name: "Claude Code",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#c6c6c6]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    name: "Cursor",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#c6c6c6]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
      </svg>
    ),
  },
  {
    name: "Codex",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#c6c6c6]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    name: "Windsurf",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#c6c6c6]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    name: "Copilot",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#c6c6c6]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Gemini",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#c6c6c6]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    name: "Any MCP Tool",
    bgClass: "bg-[#201f1f]",
    textClass: "text-[#919191]",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
];

// 7 nodes evenly spaced (360/7 ~ 51.43 deg apart), starting from top (-90 deg)
const nodePositions = tools.map((_, i) => ({
  angle: -90 + (i * 360) / tools.length,
}));

// Graph center and radius (fits 500x500 container)
const GCX = 250;
const GCY = 250;
const GR = 180;

// Muted stroke colors for spokes
const strokeColors = [
  "#919191", // Claude Code
  "#919191", // Cursor
  "#22c55e", // Codex (green — active signal)
  "#919191", // Windsurf
  "#919191", // Copilot
  "#919191", // Gemini
  "#6b7280", // Any MCP Tool
];

export function BeforeAfter() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Desktop: side-by-side — text left, diagram right */}
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left column — text */}
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-widest text-[#919191]">
              The Problem
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#e5e2e1] sm:text-4xl">
              Every AI tool is a silo
            </p>
            <p className="mt-4 text-[#c6c6c6]">
              You explain your codebase to Claude Code. Then again to Cursor. Then again to Codex.
              Each tool forgets between sessions. None of them share what they learned.
            </p>

            <div className="mt-8 rounded-md bg-[#1c1b1b] p-5">
              <p className="text-sm font-medium text-[#e5e2e1]">
                Explain once.{" "}
                <span className="text-[#22c55e]">
                  Remembered everywhere.
                </span>
              </p>
              <p className="mt-2 text-sm text-[#919191]">
                Memex is the shared memory layer between all your AI tools.
                Save context in one agent, recall it in any other.
              </p>
            </div>
          </div>

          {/* Right column — hub-and-spoke diagram (desktop) */}
          <div className="relative mx-auto mt-16 hidden lg:block" style={{ width: 500, height: 500 }}>
            <svg
              className="pointer-events-none absolute inset-0"
              viewBox="0 0 500 500"
              fill="none"
            >
              <defs>
                {strokeColors.map((color, i) => (
                  <marker
                    key={`marker-${i}`}
                    id={`arrowhead-${i}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={color} opacity="0.7" />
                  </marker>
                ))}
              </defs>

              {nodePositions.map((pos, i) => {
                const rad = (pos.angle * Math.PI) / 180;
                const nx = GCX + GR * Math.cos(rad);
                const ny = GCY + GR * Math.sin(rad);
                const dx = nx - GCX;
                const dy = ny - GCY;
                const len = Math.sqrt(dx * dx + dy * dy);
                const shortenStart = 55;
                const shortenEnd = 45;
                const sx = GCX + (dx / len) * shortenStart;
                const sy = GCY + (dy / len) * shortenStart;
                const ex = GCX + (dx / len) * (len - shortenEnd);
                const ey = GCY + (dy / len) * (len - shortenEnd);

                return (
                  <line
                    key={i}
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke={strokeColors[i]}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    markerEnd={`url(#arrowhead-${i})`}
                  >
                    <animate
                      attributeName="stroke-opacity"
                      values="0.3;0.7;0.3"
                      dur={`${2.5 + i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </line>
                );
              })}
            </svg>

            {/* Center hub — Memex */}
            <div
              className="absolute"
              style={{
                left: GCX,
                top: GCY,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="rounded-md border border-[#22c55e]/30 bg-[#1c1b1b] px-5 py-5 text-center shadow-[0_0_60px_rgba(34,197,94,0.06)]"
                style={{ width: 120, height: 120 }}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[#22c55e]/10">
                  <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="mt-1 text-sm font-bold text-[#e5e2e1]">Memex</p>
                <p className="text-[10px] text-[#22c55e]/70">Shared memory</p>
              </div>
            </div>

            {/* Tool nodes — positioned around the circle */}
            {tools.map((tool, i) => {
              const rad = (nodePositions[i].angle * Math.PI) / 180;
              const nx = GCX + GR * Math.cos(rad);
              const ny = GCY + GR * Math.sin(rad);
              return (
                <div
                  key={tool.name}
                  className="absolute"
                  style={{
                    left: nx,
                    top: ny,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className={`flex flex-col items-center rounded-md ${tool.bgClass} px-4 py-2.5 transition hover:bg-[#2a2a2a]`}
                    style={{ minWidth: 90 }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2a2a2a]">
                      <span className={tool.textClass}>{tool.icon}</span>
                    </div>
                    <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-[#e5e2e1]">{tool.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile layout — stacked */}
        <div className="mt-12 flex flex-col items-center gap-3 lg:hidden">
          <div className="grid w-full max-w-sm grid-cols-4 gap-2">
            {tools.slice(0, 4).map((tool) => (
              <div key={tool.name} className="flex flex-col items-center rounded-md bg-[#1c1b1b] p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2a2a2a]">
                  <span className={tool.textClass}>{tool.icon}</span>
                </div>
                <p className="mt-1 text-center text-[9px] font-medium text-[#e5e2e1]">{tool.name}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1 text-[#22c55e]/50">
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
          </div>

          <div className="w-full max-w-xs rounded-md border border-[#22c55e]/30 bg-[#1c1b1b] p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#22c55e]/10">
              <svg className="h-6 w-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="mt-2 text-lg font-bold text-[#e5e2e1]">Memex</p>
            <p className="text-xs text-[#22c55e]/70">Shared encrypted memory</p>
          </div>

          <div className="flex gap-1 text-[#22c55e]/50">
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
          </div>

          <div className="grid w-full max-w-sm grid-cols-3 gap-2">
            {tools.slice(4).map((tool) => (
              <div key={tool.name} className="flex flex-col items-center rounded-md bg-[#1c1b1b] p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2a2a2a]">
                  <span className={tool.textClass}>{tool.icon}</span>
                </div>
                <p className="mt-1 text-center text-[9px] font-medium text-[#e5e2e1]">{tool.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
