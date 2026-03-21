import fs from "fs";
import path from "path";

const GITHUB_DIR = path.join(process.env.HOME || "~", "Documents", "GitHub");
const KNOWLEDGE_FILES = ["CLAUDE.md", "CONTEXT.md", "PATTERNS.md"];
const EXCLUDED_DIRS = [
  "_archive",
  "node_modules",
  ".git",
  "knowledge-dashboard",
];

export interface KnowledgeFile {
  name: string;
  path: string;
  relativePath: string;
  content: string;
  lastModified: string;
  staleness: "fresh" | "stale" | "old";
  stalenessLabel: string;
}

export interface Project {
  name: string;
  path: string;
  files: KnowledgeFile[];
  healthScore: number;
  fileCount: number;
  totalPossible: number;
  lastUpdated: string | null;
  isShared: boolean;
  clientGroup: string | null;
}

function getStaleness(
  mtime: Date
): Pick<KnowledgeFile, "staleness" | "stalenessLabel"> {
  const now = new Date();
  const diffMs = now.getTime() - mtime.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 14) {
    return { staleness: "fresh", stalenessLabel: `${Math.floor(diffDays)}d ago` };
  } else if (diffDays < 28) {
    return {
      staleness: "stale",
      stalenessLabel: `${Math.floor(diffDays / 7)}w ago`,
    };
  } else {
    return {
      staleness: "old",
      stalenessLabel: `${Math.floor(diffDays / 30)}mo ago`,
    };
  }
}

function readKnowledgeFile(
  filePath: string,
  projectPath: string
): KnowledgeFile | null {
  try {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const { staleness, stalenessLabel } = getStaleness(stat.mtime);

    return {
      name: path.basename(filePath),
      path: filePath,
      relativePath: path.relative(projectPath, filePath),
      content,
      lastModified: stat.mtime.toISOString(),
      staleness,
      stalenessLabel,
    };
  } catch {
    return null;
  }
}

export function scanProjects(): Project[] {
  const projects: Project[] = [];

  // Check for shared PATTERNS.md at root level
  const sharedPatternsPath = path.join(GITHUB_DIR, "PATTERNS.md");
  if (fs.existsSync(sharedPatternsPath)) {
    const file = readKnowledgeFile(sharedPatternsPath, GITHUB_DIR);
    if (file) {
      projects.push({
        name: "Shared Patterns",
        path: GITHUB_DIR,
        files: [file],
        healthScore: 100,
        fileCount: 1,
        totalPossible: 1,
        lastUpdated: file.lastModified,
        isShared: true,
        clientGroup: null,
      });
    }
  }

  // Scan each directory in ~/Documents/GitHub/
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(GITHUB_DIR, { withFileTypes: true });
  } catch {
    return projects;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || EXCLUDED_DIRS.includes(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;

    const projectPath = path.join(GITHUB_DIR, entry.name);
    const files: KnowledgeFile[] = [];

    for (const fileName of KNOWLEDGE_FILES) {
      const filePath = path.join(projectPath, fileName);
      const file = readKnowledgeFile(filePath, projectPath);
      if (file) files.push(file);
    }

    const lastUpdated =
      files.length > 0
        ? files.reduce((latest, f) =>
            new Date(f.lastModified) > new Date(latest.lastModified)
              ? f
              : latest
          ).lastModified
        : null;

    projects.push({
      name: entry.name,
      path: projectPath,
      files,
      healthScore: Math.round(
        (files.length / KNOWLEDGE_FILES.length) * 100
      ),
      fileCount: files.length,
      totalPossible: KNOWLEDGE_FILES.length,
      lastUpdated,
      isShared: false,
      clientGroup: null,
    });
  }

  // Sort: shared first, then by file count desc, then alphabetical
  projects.sort((a, b) => {
    if (a.isShared && !b.isShared) return -1;
    if (!a.isShared && b.isShared) return 1;
    if (b.fileCount !== a.fileCount) return b.fileCount - a.fileCount;
    return a.name.localeCompare(b.name);
  });

  return projects;
}

export function getProject(name: string): Project | null {
  const projects = scanProjects();
  return projects.find((p) => p.name === name) || null;
}

export function searchProjects(query: string): {
  project: string;
  file: string;
  matches: { line: number; text: string }[];
}[] {
  const projects = scanProjects();
  const results: {
    project: string;
    file: string;
    matches: { line: number; text: string }[];
  }[] = [];
  const lowerQuery = query.toLowerCase();

  for (const project of projects) {
    for (const file of project.files) {
      const lines = file.content.split("\n");
      const matches: { line: number; text: string }[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lowerQuery)) {
          matches.push({ line: i + 1, text: lines[i].trim() });
        }
      }

      if (matches.length > 0) {
        results.push({
          project: project.name,
          file: file.name,
          matches: matches.slice(0, 5), // limit to 5 matches per file
        });
      }
    }
  }

  return results;
}
