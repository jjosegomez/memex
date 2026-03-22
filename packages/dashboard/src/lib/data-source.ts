import type { KnowledgeFile, Project } from "./scanner";
import * as localScanner from "./scanner";
import * as githubScanner from "./github-scanner";
import { auth } from "@/auth";

export type { KnowledgeFile, Project };

interface GitHubContext {
  token: string;
  org: string;
}

async function getGitHubContext(): Promise<GitHubContext | null> {
  // First: try session token from OAuth
  const session = await auth();
  if (session?.accessToken) {
    // Org comes from JWT (set during onboarding) or falls back to env
    const org = session.org || process.env.GITHUB_ORG;
    if (org) {
      return { token: session.accessToken, org };
    }
  }

  // Fallback: env vars for local dev
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_ORG) {
    return { token: process.env.GITHUB_TOKEN, org: process.env.GITHUB_ORG };
  }

  return null;
}

export async function scanProjects(): Promise<Project[]> {
  const ctx = await getGitHubContext();
  if (ctx) {
    return githubScanner.scanProjects(ctx.token, ctx.org);
  }
  return localScanner.scanProjects();
}

export async function getProject(name: string): Promise<Project | null> {
  const ctx = await getGitHubContext();
  if (ctx) {
    return githubScanner.getProject(name, ctx.token, ctx.org);
  }
  return localScanner.getProject(name);
}

export async function searchProjects(query: string): Promise<
  {
    project: string;
    file: string;
    matches: { line: number; text: string }[];
  }[]
> {
  const ctx = await getGitHubContext();
  if (ctx) {
    return githubScanner.searchProjects(query, ctx.token, ctx.org);
  }
  return localScanner.searchProjects(query);
}
