import { scanProjects } from "@/lib/data-source";
import { ProjectCard } from "@/components/project-card";

export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const projects = await scanProjects();

  const withFiles = projects.filter((p) => p.fileCount > 0);
  const withoutFiles = projects.filter((p) => p.fileCount === 0);
  const totalProjects = projects.filter((p) => !p.isShared).length;
  const projectsWithKnowledge = withFiles.filter((p) => !p.isShared).length;
  const coveragePercent =
    totalProjects > 0
      ? Math.round((projectsWithKnowledge / totalProjects) * 100)
      : 0;
  const totalFiles = projects.reduce((sum, p) => sum + p.fileCount, 0);

  // Count projects with stale/old files as "integrity alerts"
  const alertCount = projects.filter((p) =>
    p.files.some((f) => f.staleness === "old")
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Greeting + Deploy Button */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {getGreeting()}, Juan
          </h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Knowledge Mode: Agent-Context
          </p>
        </div>
        <a
          href="/search"
          className="inline-flex items-center gap-2 border border-border rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          + Search Knowledge
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {/* Active Projects */}
        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Active Projects
          </p>
          <p className="text-3xl font-semibold">{totalProjects}</p>
          <p className="text-xs text-tertiary mt-1">
            +{projectsWithKnowledge} with knowledge
          </p>
        </div>

        {/* Knowledge Health */}
        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Knowledge Health
          </p>
          <p className="text-3xl font-semibold">{coveragePercent}%</p>
          <div className="mt-2 h-1.5 w-full bg-surface-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-tertiary rounded-full transition-all"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        {/* Integrity Alerts */}
        <div className="bg-surface-high rounded-sm p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Integrity Alerts
          </p>
          <p className="text-3xl font-semibold">
            {alertCount > 0 ? (
              <span className="text-amber-400">{alertCount}</span>
            ) : (
              <span className="text-tertiary">0</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {alertCount > 0
              ? `${alertCount === 1 ? "project needs" : "projects need"} update`
              : "all files current"}
          </p>
        </div>
      </div>

      {/* Current Projects */}
      {withFiles.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Current Projects ({withFiles.length})
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              {totalFiles} knowledge files
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {withFiles.map((project) => (
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
        </section>
      )}

      {/* Projects Without Knowledge */}
      {withoutFiles.length > 0 && (
        <section>
          <h2 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-wider mb-4">
            No Knowledge Files ({withoutFiles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {withoutFiles.map((project) => (
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
        </section>
      )}
    </div>
  );
}
