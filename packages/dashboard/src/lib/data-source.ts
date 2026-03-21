import type { KnowledgeFile, Project } from "./scanner";
import * as localScanner from "./scanner";
import * as githubScanner from "./github-scanner";

function useGitHub(): boolean {
  return Boolean(process.env.GITHUB_ORG);
}

export type { KnowledgeFile, Project };

export async function scanProjects(): Promise<Project[]> {
  if (useGitHub()) {
    return githubScanner.scanProjects();
  }
  return localScanner.scanProjects();
}

export async function getProject(name: string): Promise<Project | null> {
  if (useGitHub()) {
    return githubScanner.getProject(name);
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
  if (useGitHub()) {
    return githubScanner.searchProjects(query);
  }
  return localScanner.searchProjects(query);
}
