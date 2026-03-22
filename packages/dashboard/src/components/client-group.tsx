"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/scanner";
import { ProjectCard } from "./project-card";

interface ClientGroupProps {
  groupName: string;
  projects: Project[];
  defaultOpen?: boolean;
}

export function ClientGroup({
  groupName,
  projects,
  defaultOpen = true,
}: ClientGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const totalHealth = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length)
    : 0;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mb-3 group"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
          {groupName}
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {projects.length} {projects.length === 1 ? "project" : "projects"} &middot; {totalHealth}% health
        </span>
      </button>
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.name}
              name={project.name}
              files={project.files}
              healthScore={project.healthScore}
              fileCount={project.fileCount}
              totalPossible={project.totalPossible}
              isShared={project.isShared}
              lastUpdated={project.lastUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
