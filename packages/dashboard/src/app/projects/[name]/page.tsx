import { getProject } from "@/lib/data-source";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HealthBadge, StalenessBadge } from "@/components/health-badge";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export const dynamic = "force-dynamic";

function StalenessBar({
  name,
  staleness,
  label,
}: {
  name: string;
  staleness: "fresh" | "stale" | "old";
  label: string;
}) {
  const percentage =
    staleness === "fresh" ? 92 : staleness === "stale" ? 55 : 20;

  const barColor =
    staleness === "fresh"
      ? "bg-emerald-500"
      : staleness === "stale"
        ? "bg-amber-500"
        : "bg-red-500";

  const textColor =
    staleness === "fresh"
      ? "text-emerald-400"
      : staleness === "stale"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {name}
        </span>
        <span className={`text-xs font-mono font-semibold ${textColor}`}>
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-highest/50 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LargeHealthRing({
  score,
}: {
  score: number;
}) {
  const size = 64;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 66
      ? "text-emerald-400"
      : score >= 33
        ? "text-amber-400"
        : "text-red-400";

  const strokeColor =
    score >= 66 ? "#34d399" : score >= 33 ? "#fbbf24" : "#f87171";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71,71,71,0.3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={`absolute text-sm font-semibold font-mono ${color}`}
      >
        {score}%
      </span>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const project = await getProject(decodeURIComponent(name));

  if (!project) {
    notFound();
  }

  const freshCount = project.files.filter(
    (f) => f.staleness === "fresh"
  ).length;
  const staleCount = project.files.filter(
    (f) => f.staleness === "stale"
  ).length;
  const oldCount = project.files.filter(
    (f) => f.staleness === "old"
  ).length;
  const missingCount = project.totalPossible - project.fileCount;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-6">
        <Link
          href="/"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span className="mx-2 opacity-40">&gt;</span>
        <span className="text-foreground">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <HealthBadge
            score={project.healthScore}
            fileCount={project.fileCount}
            totalPossible={project.totalPossible}
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.isShared ? "Shared Patterns" : project.name}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {project.fileCount} / {project.totalPossible} knowledge files
              {project.lastUpdated && (
                <span className="ml-2 opacity-60">
                  &middot; Last sync{" "}
                  {new Date(project.lastUpdated).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground border border-border rounded-md hover:text-foreground hover:border-muted-foreground/30 transition-colors"
          >
            All Projects
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Knowledge Health Breakdown */}
          {project.files.length > 0 && (
            <Card className="bg-surface-low border-border">
              <CardHeader className="pb-4">
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                  Knowledge Health Breakdown
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.files.map((file) => (
                  <StalenessBar
                    key={file.name}
                    name={file.name}
                    staleness={file.staleness}
                    label={file.stalenessLabel}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* File cards with markdown content */}
          {project.files.length === 0 ? (
            <Card className="bg-surface-low border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-lg mb-2">No knowledge files found</p>
                <p className="text-sm">
                  Add a CLAUDE.md, CONTEXT.md, or PATTERNS.md to this project
                  to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {project.files.map((file) => (
                <Card
                  key={file.name}
                  id={file.name}
                  className="bg-surface-low border-border"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs border-border"
                        >
                          {file.name}
                        </Badge>
                      </CardTitle>
                      <StalenessBadge
                        staleness={file.staleness}
                        label={file.stalenessLabel}
                      />
                    </div>
                  </CardHeader>
                  <Separator className="opacity-30" />
                  <CardContent className="pt-6">
                    <MarkdownRenderer content={file.content} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Health Score ring (large) */}
          <Card className="bg-surface-low border-border">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                Knowledge Score
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <LargeHealthRing score={project.healthScore} />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {project.healthScore >= 66
                      ? "Healthy"
                      : project.healthScore >= 33
                        ? "Needs Attention"
                        : "Critical"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {project.fileCount} of {project.totalPossible} files present
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Infrastructure */}
          <Card className="bg-surface-low border-border">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                Project Infrastructure
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Repository */}
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  Repository
                </p>
                <p className="text-xs font-mono text-foreground/80 truncate">
                  {project.path}
                </p>
              </div>

              {/* Last Knowledge Sync */}
              {project.lastUpdated && (
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    Last Knowledge Sync
                  </p>
                  <p className="text-xs font-mono text-foreground/80">
                    {new Date(project.lastUpdated).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              <Separator className="opacity-30" />

              {/* Knowledge Files */}
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                  Knowledge Files
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["CLAUDE.md", "CONTEXT.md", "PATTERNS.md"].map(
                    (fileName) => {
                      const exists = project.files.some(
                        (f) => f.name === fileName
                      );
                      return (
                        <Badge
                          key={fileName}
                          variant="outline"
                          className={`font-mono text-[10px] ${
                            exists
                              ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                              : "border-border text-muted-foreground/50 opacity-50"
                          }`}
                        >
                          {exists ? "\u2713" : "\u2717"} {fileName}
                        </Badge>
                      );
                    }
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrity Alerts */}
          <Card className="bg-surface-low border-border">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                Integrity Alerts
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {missingCount > 0 && (
                <div className="flex items-start gap-2.5 ai-accent pl-3 py-1">
                  <div>
                    <p className="text-xs font-medium text-amber-400">
                      {missingCount} missing{" "}
                      {missingCount === 1 ? "file" : "files"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {["CLAUDE.md", "CONTEXT.md", "PATTERNS.md"]
                        .filter(
                          (fn) => !project.files.some((f) => f.name === fn)
                        )
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {staleCount > 0 && (
                <div className="flex items-start gap-2.5 ai-accent pl-3 py-1">
                  <div>
                    <p className="text-xs font-medium text-amber-400">
                      {staleCount} stale{" "}
                      {staleCount === 1 ? "file" : "files"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {project.files
                        .filter((f) => f.staleness === "stale")
                        .map((f) => f.name)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {oldCount > 0 && (
                <div className="flex items-start gap-2.5 ai-accent pl-3 py-1">
                  <div>
                    <p className="text-xs font-medium text-red-400">
                      {oldCount} outdated{" "}
                      {oldCount === 1 ? "file" : "files"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {project.files
                        .filter((f) => f.staleness === "old")
                        .map((f) => f.name)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {missingCount === 0 &&
                staleCount === 0 &&
                oldCount === 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-xs text-emerald-400 font-mono">
                      All systems healthy
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* File Freshness Summary */}
          <Card className="bg-surface-low border-border">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                Freshness Summary
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-semibold font-mono text-emerald-400">
                    {freshCount}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">
                    Fresh
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-mono text-amber-400">
                    {staleCount}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">
                    Stale
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-mono text-red-400">
                    {oldCount}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">
                    Old
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
