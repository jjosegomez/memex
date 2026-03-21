"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { HealthBadge, StalenessBadge } from "@/components/health-badge";

interface FileInfo {
  name: string;
  staleness: "fresh" | "stale" | "old";
  stalenessLabel: string;
}

interface ProjectCardProps {
  name: string;
  files: FileInfo[];
  healthScore: number;
  fileCount: number;
  totalPossible: number;
  isShared: boolean;
  lastUpdated?: string | null;
}

const KNOWLEDGE_FILES = ["CLAUDE.md", "CONTEXT.md", "PATTERNS.md"];

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function ProjectCard({
  name,
  files,
  healthScore,
  fileCount,
  totalPossible,
  isShared,
  lastUpdated,
}: ProjectCardProps) {
  const fileMap = new Map(files.map((f) => [f.name, f]));
  const displayPath = isShared
    ? "~/Documents/GitHub"
    : `~/Documents/GitHub/${name}`;

  return (
    <Link href={`/projects/${encodeURIComponent(name)}`}>
      <div className="bg-surface-high rounded-sm p-4 hover:bg-surface-highest transition-colors cursor-pointer h-full flex flex-col gap-3">
        {/* Header: name + health ring */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {isShared ? "Shared Patterns" : name}
            </h3>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider truncate mt-0.5">
              PATH: {displayPath}
            </p>
          </div>
          <HealthBadge
            score={healthScore}
            fileCount={fileCount}
            totalPossible={totalPossible}
          />
        </div>

        {/* File badges */}
        <div className="flex flex-wrap gap-1.5">
          {(isShared ? ["PATTERNS.md"] : KNOWLEDGE_FILES).map((fileName) => {
            const file = fileMap.get(fileName);
            if (file) {
              return (
                <StalenessBadge
                  key={fileName}
                  staleness={file.staleness}
                  label={fileName}
                />
              );
            }
            return (
              <Badge
                key={fileName}
                variant="outline"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/40 border-dashed border-border"
              >
                {fileName}
              </Badge>
            );
          })}
        </div>

        {/* Footer: updated timestamp */}
        <div className="mt-auto pt-1">
          <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {lastUpdated
              ? `Updated ${getRelativeTime(lastUpdated)}`
              : "No files yet"}
          </p>
        </div>
      </div>
    </Link>
  );
}
