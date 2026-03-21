import fs from "fs";
import path from "path";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { scanProjects } from "@/lib/data-source";

export const dynamic = "force-dynamic";

const GITHUB_DIR = path.join(process.env.HOME || "~", "Documents", "GitHub");
const PATTERNS_PATH = path.join(GITHUB_DIR, "PATTERNS.md");

interface StandardsFile {
  name: string;
  content: string;
  lastModified: string;
  source: string;
}

function readFileIfExists(filePath: string): StandardsFile | null {
  try {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    return {
      name: path.basename(filePath),
      content,
      lastModified: stat.mtime.toISOString(),
      source: path.dirname(filePath),
    };
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function complianceFromStaleness(days: number): number {
  if (days < 7) return 98;
  if (days < 14) return 85;
  if (days < 28) return 65;
  return 40;
}

export default async function StandardsPage() {
  const isGitHubMode = !!process.env.GITHUB_ORG;

  // Collect standards files
  const standardsFiles: StandardsFile[] = [];

  // 1. Shared PATTERNS.md
  const patterns = readFileIfExists(PATTERNS_PATH);
  if (patterns) {
    standardsFiles.push(patterns);
  }

  // 2. Scan for agency-standards.md in any project
  const projects = await scanProjects();
  for (const project of projects) {
    const agencyPath = path.join(project.path, "agency-standards.md");
    const file = readFileIfExists(agencyPath);
    if (file) {
      standardsFiles.push(file);
    }
  }

  // Aggregate stats
  const totalStandards = standardsFiles.length;
  const avgCompliance =
    totalStandards > 0
      ? Math.round(
          standardsFiles.reduce(
            (sum, f) => sum + complianceFromStaleness(daysSince(f.lastModified)),
            0
          ) / totalStandards
        )
      : 0;
  const lastUpdated =
    standardsFiles.length > 0
      ? standardsFiles.reduce((latest, f) =>
          new Date(f.lastModified) > new Date(latest.lastModified) ? f : latest
        ).lastModified
      : null;

  // Count projects with CLAUDE.md (proxy for "standards-compliant" projects)
  const projectsWithClaude = projects.filter(
    (p) => !p.isShared && p.files.some((f) => f.name === "CLAUDE.md")
  ).length;
  const totalProjects = projects.filter((p) => !p.isShared).length;
  const adoptionPercent =
    totalProjects > 0
      ? Math.round((projectsWithClaude / totalProjects) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span className="mx-2 opacity-40">&gt;</span>
        <span className="text-foreground">Agency Standards</span>
      </nav>

      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Agency Standards
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global guidelines and compliance requirements for all projects
        </p>
      </div>

      {/* GitHub mode placeholder */}
      {isGitHubMode && (
        <Card className="bg-surface-low border-border mb-6">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground font-mono">
              GITHUB_ORG detected: <span className="text-foreground">{process.env.GITHUB_ORG}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              GitHub-based standards sync from an <code className="bg-muted px-1.5 py-0.5 rounded text-xs">agency-standards</code> repo is planned for a future release.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Standards Files
          </p>
          <p className="text-3xl font-semibold">{totalStandards}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalStandards === 1 ? "document" : "documents"} found
          </p>
        </div>

        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Avg. Freshness
          </p>
          <p className="text-3xl font-semibold">
            <span className={avgCompliance >= 70 ? "text-tertiary" : avgCompliance >= 50 ? "text-amber-400" : "text-red-400"}>
              {avgCompliance}%
            </span>
          </p>
          <div className="mt-2 h-1.5 w-full bg-surface-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-tertiary rounded-full transition-all"
              style={{ width: `${avgCompliance}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Project Adoption
          </p>
          <p className="text-3xl font-semibold">{adoptionPercent}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {projectsWithClaude} / {totalProjects} projects with CLAUDE.md
          </p>
        </div>

        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Last Updated
          </p>
          <p className="text-lg font-semibold font-mono">
            {lastUpdated ? formatDate(lastUpdated) : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {lastUpdated ? `${daysSince(lastUpdated)}d ago` : "no files found"}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column — standards content */}
        <div className="space-y-6">
          {/* Filter bar placeholder */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded bg-surface-lowest px-3 py-1.5 text-sm text-muted-foreground flex-1">
              <span className="text-xs font-mono opacity-60">Filter standards...</span>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] border-border">
              All Categories
            </Badge>
          </div>

          {/* Shared Patterns */}
          {patterns && (
            <Card className="bg-surface-low border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-tertiary/30 text-tertiary bg-tertiary/5"
                    >
                      Shared
                    </Badge>
                    <CardTitle className="text-base font-medium">
                      PATTERNS.md
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] border-border">
                      v{daysSince(patterns.lastModified) < 7 ? "current" : "stale"}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatDate(patterns.lastModified)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <Separator className="opacity-30" />
              <CardContent className="pt-6">
                <MarkdownRenderer content={patterns.content} />
              </CardContent>
            </Card>
          )}

          {/* Agency standards files from projects */}
          {standardsFiles
            .filter((f) => f.name !== "PATTERNS.md")
            .map((file) => (
              <Card key={`${file.source}-${file.name}`} className="bg-surface-low border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-border"
                      >
                        {path.basename(file.source)}
                      </Badge>
                      <CardTitle className="text-base font-medium">
                        {file.name}
                      </CardTitle>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatDate(file.lastModified)}
                    </span>
                  </div>
                </CardHeader>
                <Separator className="opacity-30" />
                <CardContent className="pt-6">
                  <MarkdownRenderer content={file.content} />
                </CardContent>
              </Card>
            ))}

          {/* Empty state */}
          {standardsFiles.length === 0 && (
            <Card className="bg-surface-low border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-lg mb-2">No standards files found</p>
                <p className="text-sm">
                  Add a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">PATTERNS.md</code> to{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">~/Documents/GitHub/</code> or{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">agency-standards.md</code> to any project.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Global Alerts */}
          <Card className="bg-surface-low border-border">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                Global Alerts
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalProjects - projectsWithClaude > 0 && (
                <div className="flex items-start gap-2.5 ai-accent pl-3 py-1">
                  <div>
                    <p className="text-xs font-medium text-amber-400">
                      {totalProjects - projectsWithClaude} projects without CLAUDE.md
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Missing agent configuration
                    </p>
                  </div>
                </div>
              )}

              {standardsFiles.some((f) => daysSince(f.lastModified) > 28) && (
                <div className="flex items-start gap-2.5 ai-accent pl-3 py-1">
                  <div>
                    <p className="text-xs font-medium text-red-400">
                      Outdated standards detected
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Some files have not been updated in 28+ days
                    </p>
                  </div>
                </div>
              )}

              {totalProjects - projectsWithClaude === 0 &&
                !standardsFiles.some((f) => daysSince(f.lastModified) > 28) && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-xs text-emerald-400 font-mono">
                      All standards current
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* AI Standards Analysis */}
          <Card className="bg-surface-low border-border ai-accent">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-tertiary uppercase tracking-widest">
                AI Standards Analysis
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  Coverage
                </p>
                <p className="text-xs text-foreground/80">
                  {projectsWithClaude} of {totalProjects} projects follow agency
                  standards with a CLAUDE.md file defining agent behavior.
                </p>
              </div>
              <Separator className="opacity-30" />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  Recommendation
                </p>
                <p className="text-xs text-foreground/80">
                  {adoptionPercent >= 80
                    ? "Strong adoption. Focus on keeping existing standards fresh."
                    : adoptionPercent >= 50
                      ? "Moderate adoption. Prioritize adding CLAUDE.md to remaining projects."
                      : "Low adoption. Consider running a standards sprint to onboard projects."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agency Templates */}
          <Card className="bg-surface-low border-border">
            <CardHeader className="pb-3">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                Agency Templates
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {["CLAUDE.md", "CONTEXT.md", "PATTERNS.md"].map((template) => {
                const count = projects.filter(
                  (p) => !p.isShared && p.files.some((f) => f.name === template)
                ).length;
                return (
                  <div key={template} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-border"
                      >
                        {template}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {count} / {totalProjects} projects
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
