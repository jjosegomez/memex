"use server";

import { auth } from "@/auth";
import { Octokit } from "octokit";
import Anthropic from "@anthropic-ai/sdk";

interface GenerateResult {
  success: boolean;
  prUrl?: string;
  error?: string;
}

async function fetchRepoContext(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string> {
  const parts: string[] = [];

  // Get repo info
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  parts.push(`# Repository: ${repoData.full_name}`);
  if (repoData.description) parts.push(`Description: ${repoData.description}`);
  parts.push(`Language: ${repoData.language || "Unknown"}`);
  parts.push("");

  // Get README
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    if ("content" in data) {
      const readme = Buffer.from(data.content, "base64").toString("utf-8");
      parts.push("## README.md");
      parts.push(readme.slice(0, 3000)); // Truncate long READMEs
      parts.push("");
    }
  } catch {
    // No README
  }

  // Get package.json (if exists)
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "package.json",
    });
    if (!Array.isArray(data) && data.type === "file" && "content" in data) {
      const pkg = Buffer.from(data.content, "base64").toString("utf-8");
      parts.push("## package.json");
      parts.push(pkg.slice(0, 2000));
      parts.push("");
    }
  } catch {
    // No package.json
  }

  // Get directory tree (top level + one level deep)
  try {
    const { data: tree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "false",
    });

    parts.push("## Top-level files");
    for (const item of tree.tree.slice(0, 50)) {
      parts.push(`${item.type === "tree" ? "dir" : "file"}: ${item.path}`);
    }
    parts.push("");

    // Get src/ directory if it exists
    const srcDir = tree.tree.find(
      (t) => t.path === "src" && t.type === "tree"
    );
    if (srcDir?.sha) {
      const { data: srcTree } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: srcDir.sha,
      });
      parts.push("## src/ directory");
      for (const item of srcTree.tree.slice(0, 50)) {
        parts.push(
          `${item.type === "tree" ? "dir" : "file"}: src/${item.path}`
        );
      }
      parts.push("");
    }
  } catch {
    // Can't read tree
  }

  return parts.join("\n");
}

export async function generateClaudeMd(
  owner: string,
  repo: string
): Promise<GenerateResult> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return { success: false, error: "Anthropic API key not configured" };
  }

  const octokit = new Octokit({ auth: session.accessToken });

  try {
    // 1. Fetch repo context
    const context = await fetchRepoContext(octokit, owner, repo);

    // 2. Generate CLAUDE.md with Claude
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert at writing CLAUDE.md files — configuration files that help AI coding agents (like Claude Code) understand and work effectively with a codebase.

Based on the following repository information, generate a CLAUDE.md file. The file should include:

1. **Project description** — one paragraph explaining what this project does
2. **Tech stack** — languages, frameworks, key dependencies
3. **Project structure** — key directories and what they contain
4. **Commands** — how to install, build, test, run dev mode
5. **Key implementation details** — important patterns, conventions, gotchas
6. **Conventions** — coding style, naming conventions, error handling patterns

Be concise and practical. Focus on what an AI agent needs to work effectively in this codebase. Don't include information you're unsure about — only state what's clearly evident from the repo structure and config files.

Format as clean Markdown. Start with "# CLAUDE.md — [project name]".

---

${context}`,
        },
      ],
    });

    const claudeMdContent =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (!claudeMdContent) {
      return { success: false, error: "Failed to generate content" };
    }

    // 3. Create a branch, commit the file, and open a PR
    // Get default branch SHA
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create branch
    const branchName = `memex/add-claude-md-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Create or update the file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "CLAUDE.md",
      message: "Add CLAUDE.md for AI agent context\n\nGenerated by Memex Knowledge Dashboard",
      content: Buffer.from(claudeMdContent).toString("base64"),
      branch: branchName,
    });

    // Create PR
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: "Add CLAUDE.md for AI agent context",
      body: `## What\n\nAdds a \`CLAUDE.md\` file to help AI coding agents understand this codebase.\n\n## Why\n\nCLAUDE.md is a configuration file that provides AI agents (Claude Code, Cursor, etc.) with project context — tech stack, conventions, key patterns, and development commands. This helps agents write better, more idiomatic code.\n\n## Generated by\n\n[Memex Knowledge Dashboard](https://memex-dashboard.netlify.app) using Claude Sonnet.\n\nPlease review the generated content and adjust any details that may be inaccurate.`,
      head: branchName,
      base: defaultBranch,
    });

    return { success: true, prUrl: pr.html_url };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}
