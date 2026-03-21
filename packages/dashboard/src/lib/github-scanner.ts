import { Octokit } from "octokit";

import type { KnowledgeFile, Project } from "./scanner";

const KNOWLEDGE_FILES = ["CLAUDE.md", "CONTEXT.md", "PATTERNS.md"];
const SHARED_REPO_NAMES = ["agency-standards", ".github"];

// In-memory cache with 5-minute TTL
let cachedProjects: Project[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required for GitHub scanner mode");
  }
  return new Octokit({ auth: token });
}

function getOrg(): string {
  const org = process.env.GITHUB_ORG;
  if (!org) {
    throw new Error("GITHUB_ORG is required for GitHub scanner mode");
  }
  return org;
}

function getStaleness(
  lastModified: Date
): Pick<KnowledgeFile, "staleness" | "stalenessLabel"> {
  const now = new Date();
  const diffMs = now.getTime() - lastModified.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 14) {
    return {
      staleness: "fresh",
      stalenessLabel: `${Math.floor(diffDays)}d ago`,
    };
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

function extractClientGroup(repoName: string): string | null {
  const dashIndex = repoName.indexOf("-");
  if (dashIndex === -1) return null;
  return repoName.substring(0, dashIndex);
}

async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string
): Promise<{ content: string; lastModified: string } | null> {
  try {
    // Fetch file content
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      return null;
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");

    // Fetch last commit date for the file
    let lastModified: string;
    try {
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        path: filePath,
        per_page: 1,
      });

      lastModified =
        commits.length > 0 && commits[0].commit.committer?.date
          ? commits[0].commit.committer.date
          : new Date().toISOString();
    } catch {
      lastModified = new Date().toISOString();
    }

    return { content, lastModified };
  } catch {
    // File doesn't exist or other error
    return null;
  }
}

async function fetchRepoKnowledgeFiles(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<KnowledgeFile[]> {
  const files: KnowledgeFile[] = [];

  for (const fileName of KNOWLEDGE_FILES) {
    const result = await fetchFileContent(octokit, owner, repo, fileName);
    if (result) {
      const lastModifiedDate = new Date(result.lastModified);
      const { staleness, stalenessLabel } = getStaleness(lastModifiedDate);

      files.push({
        name: fileName,
        path: `https://github.com/${owner}/${repo}/blob/main/${fileName}`,
        relativePath: fileName,
        content: result.content,
        lastModified: result.lastModified,
        staleness,
        stalenessLabel,
      });
    }
  }

  return files;
}

export async function scanProjects(): Promise<Project[]> {
  // Check cache
  const now = Date.now();
  if (cachedProjects && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProjects;
  }

  const octokit = getOctokit();
  const org = getOrg();
  const projects: Project[] = [];

  let repos: { name: string; html_url: string }[];
  try {
    const { data } = await octokit.rest.repos.listForOrg({
      org,
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });
    repos = data;
  } catch (error: unknown) {
    // Handle rate limiting — return cached data if available
    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status: number }).status === 403
    ) {
      if (cachedProjects) return cachedProjects;
    }
    throw error;
  }

  // Check for shared/agency-wide standards repos
  for (const repo of repos) {
    if (SHARED_REPO_NAMES.includes(repo.name)) {
      const files = await fetchRepoKnowledgeFiles(octokit, org, repo.name);
      if (files.length > 0) {
        const lastUpdated = files.reduce((latest, f) =>
          new Date(f.lastModified) > new Date(latest.lastModified) ? f : latest
        ).lastModified;

        projects.push({
          name: repo.name === ".github" ? "Org Standards" : "Agency Standards",
          path: repo.html_url,
          files,
          healthScore: Math.round((files.length / KNOWLEDGE_FILES.length) * 100),
          fileCount: files.length,
          totalPossible: KNOWLEDGE_FILES.length,
          lastUpdated,
          isShared: true,
          clientGroup: null,
        });
      }
    }
  }

  // Process all other repos
  for (const repo of repos) {
    if (SHARED_REPO_NAMES.includes(repo.name)) continue;

    let files: KnowledgeFile[];
    try {
      files = await fetchRepoKnowledgeFiles(octokit, org, repo.name);
    } catch (error: unknown) {
      // Handle rate limiting gracefully
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 403
      ) {
        if (cachedProjects) {
          cachedProjects = [...projects];
          cacheTimestamp = now;
          return cachedProjects;
        }
        break;
      }
      files = [];
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
      name: repo.name,
      path: repo.html_url,
      files,
      healthScore: Math.round((files.length / KNOWLEDGE_FILES.length) * 100),
      fileCount: files.length,
      totalPossible: KNOWLEDGE_FILES.length,
      lastUpdated,
      isShared: false,
      clientGroup: extractClientGroup(repo.name),
    });
  }

  // Sort: shared first, then by file count desc, then alphabetical
  projects.sort((a, b) => {
    if (a.isShared && !b.isShared) return -1;
    if (!a.isShared && b.isShared) return 1;
    if (b.fileCount !== a.fileCount) return b.fileCount - a.fileCount;
    return a.name.localeCompare(b.name);
  });

  // Update cache
  cachedProjects = projects;
  cacheTimestamp = now;

  return projects;
}

export async function getProject(name: string): Promise<Project | null> {
  const projects = await scanProjects();
  return projects.find((p) => p.name === name) || null;
}

export async function searchProjects(query: string): Promise<
  {
    project: string;
    file: string;
    matches: { line: number; text: string }[];
  }[]
> {
  const projects = await scanProjects();
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
          matches: matches.slice(0, 5),
        });
      }
    }
  }

  return results;
}
