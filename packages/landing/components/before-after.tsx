"use client";

const tools = [
  {
    name: "Claude Code",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    name: "Cursor",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
      </svg>
    ),
  },
  {
    name: "Codex",
    bgClass: "bg-green-500/10",
    textClass: "text-green-400",
    borderClass: "border-green-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    name: "Windsurf",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    name: "Copilot",
    bgClass: "bg-sky-500/10",
    textClass: "text-sky-400",
    borderClass: "border-sky-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Gemini",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    name: "Any MCP Tool",
    bgClass: "bg-white/5",
    textClass: "text-gray-400",
    borderClass: "border-white/10",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
];

// 7 nodes evenly spaced (360/7 ≈ 51.43° apart), starting from top (-90°)
const nodePositions = tools.map((_, i) => ({
  angle: -90 + (i * 360) / tools.length,
}));

// Graph center and radius (fits 500×500 container)
const GCX = 250;
const GCY = 250;
const GR = 180;

// Stroke colors matching each tool
const strokeColors = [
  "#f97316", // orange — Claude Code
  "#a855f7", // purple — Cursor
  "#22c55e", // green — Codex
  "#06b6d4", // cyan — Windsurf
  "#0ea5e9", // sky — Copilot
  "#3b82f6", // blue — Gemini
  "#6b7280", // gray — Any MCP Tool
];

export function BeforeAfter() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Desktop: side-by-side — text left, diagram right */}
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left column — text */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              The Problem
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Every AI tool is a silo
            </p>
            <p className="mt-4 text-gray-400">
              You explain your codebase to Claude Code. Then again to Cursor. Then again to Codex.
              Each tool forgets between sessions. None of them share what they learned.
            </p>

            <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-sm font-medium text-white">
                Explain once.{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Remembered everywhere.
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-500">
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
              <div className="rounded-full border-2 border-blue-500/30 bg-blue-500/5 px-5 py-5 text-center shadow-lg shadow-blue-500/10"
                style={{ width: 120, height: 120 }}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="mt-1 text-sm font-bold text-white">Memex</p>
                <p className="text-[10px] text-blue-300">Shared memory</p>
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
                  <div className={`flex flex-col items-center rounded-xl border ${tool.borderClass} bg-white/[0.02] px-4 py-2.5 backdrop-blur-sm transition hover:bg-white/[0.05]`}
                    style={{ minWidth: 90 }}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tool.bgClass}`}>
                      <span className={tool.textClass}>{tool.icon}</span>
                    </div>
                    <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-white">{tool.name}</p>
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
              <div key={tool.name} className={`flex flex-col items-center rounded-xl border ${tool.borderClass} bg-white/[0.02] p-2.5`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tool.bgClass}`}>
                  <span className={tool.textClass}>{tool.icon}</span>
                </div>
                <p className="mt-1 text-center text-[9px] font-medium text-white">{tool.name}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1 text-blue-500/50">
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
          </div>

          <div className="w-full max-w-xs rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="mt-2 text-lg font-bold text-white">Memex</p>
            <p className="text-xs text-blue-300">Shared encrypted memory</p>
          </div>

          <div className="flex gap-1 text-blue-500/50">
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
            <span className="text-lg">&darr;</span>
          </div>

          <div className="grid w-full max-w-sm grid-cols-3 gap-2">
            {tools.slice(4).map((tool) => (
              <div key={tool.name} className={`flex flex-col items-center rounded-xl border ${tool.borderClass} bg-white/[0.02] p-2.5`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tool.bgClass}`}>
                  <span className={tool.textClass}>{tool.icon}</span>
                </div>
                <p className="mt-1 text-center text-[9px] font-medium text-white">{tool.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
