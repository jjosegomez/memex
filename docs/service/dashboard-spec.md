# Knowledge Base Dashboard — Spec

## The Problem

Knowledge that agents use (CLAUDE.md, CONTEXT.md, PATTERNS.md, decisions) lives in markdown files in git repos. This is great for agents — they read files natively. But for humans:
- No bird's eye view across repos
- Hard to search across all knowledge
- No way to see what's stale or missing
- Non-technical stakeholders can't access it
- No visibility into what the agents "know"

## The Solution

A lightweight web dashboard that reads from git and displays the knowledge base with search, editing, and management features.

## Architecture

```
Git Repos (source of truth)
  ├── CLAUDE.md (coding standards)
  ├── CONTEXT.md (project state)
  ├── PATTERNS.md (reusable patterns)
  └── decisions/ (ADRs)
       ↕ read/write via GitHub API
Knowledge Dashboard (Next.js app)
  ├── Browse all repos' knowledge files
  ├── Search across everything
  ├── Edit in-browser (commits to git via PR)
  ├── Staleness indicators
  └── Team activity feed
```

**Key principle:** Git stays the source of truth. The dashboard is a UI layer, not a database. No sync issues, no data duplication.

## Core Features

### 1. Client Project Overview
- Card grid of all client projects with status indicators
- Per-project: stack tags, team members assigned, knowledge health score
- Quick filters: by client, by stack, by staleness, by team member
- "Agency-wide" section for shared standards and patterns

### 2. Knowledge Browser
- Tree view: Client Project → File type (standards, context, patterns, decisions)
- Rendered markdown with syntax highlighting
- Last updated date + who updated it
- Staleness badge (yellow: >2 weeks, red: >4 weeks since last update)
- Visual indicator for agency-wide vs. project-specific knowledge

### 3. Search
- Full-text search across all knowledge files in all projects
- Filter by client project, file type, date range
- Results show snippet + file + client project
- Cross-project search: "how do we handle auth?" shows patterns from every client

### 4. Inline Editing
- Edit any knowledge file in the browser
- Changes create a PR (not direct commit) — maintains review flow
- Diff preview before submitting
- Optional: suggest updates via AI ("this section seems outdated based on recent commits")

### 5. Health Dashboard
- Which projects have complete knowledge files? Which don't?
- Which context files are stale?
- Coverage score: % of projects with complete knowledge
- Recent changes feed (who updated what, when, for which client)
- Alert: "Developer X rotated off Project Y — knowledge capture needed"

### 6. Project Onboarding View
- "Assigned to a new project? Start here" page per client project
- Aggregates the most important context: stack, architecture, constraints, gotchas
- Curated reading order for developers new to that project
- Client-specific constraints highlighted prominently (compliance, deployment, etc.)

### 7. Developer View
- "My projects" — knowledge for all projects a developer is currently assigned to
- Quick-switch between project contexts
- Personal notes layer (visible only to that developer)

## Tech Stack (recommended)

- **Next.js + TypeScript + Tailwind + shadcn/ui** (Juan's primary stack)
- **GitHub API** (via Octokit) for reading/writing files
- **No database** — git IS the database
- **Auth**: GitHub OAuth (team members already have GitHub accounts)
- **Deploy**: Netlify or Vercel

## MVP Scope (what to build first)

1. GitHub OAuth login
2. Client project grid — list all repos in the org, grouped by client/project
3. For each project, show knowledge files (CLAUDE.md, CONTEXT.md, PATTERNS.md) if they exist
4. Rendered markdown view with syntax highlighting
5. Search across all projects
6. Staleness indicators (last updated badge)
7. Agency-wide section (shared standards repo)

That's it for v1. Inline editing, health scores, onboarding views, developer personal view come in v2.

## Pages

```
/                           → Agency dashboard (all client projects, health overview)
/projects                   → Client project grid with filters
/projects/[project]         → Single project's knowledge files + team + constraints
/projects/[project]/[file]  → Single file view (rendered markdown)
/projects/[project]/onboard → Onboarding guide for that specific project
/agency                     → Agency-wide standards, shared patterns
/search                     → Global search across all projects
/health                     → Knowledge health dashboard
/me                         → Developer's personal view (my projects, my notes)
```

## Why Not Just Use Notion/Confluence?

- Agents can't read Notion natively (without an MCP server + API setup per client)
- Two sources of truth = guaranteed drift
- Git-based knowledge is version controlled for free
- The dashboard is a viewer, not a separate system to maintain
- If the dashboard goes down, nothing breaks — agents still read files from git

## Future: Multi-Client Support

If this becomes a product for multiple clients:
- Each client = a GitHub org
- Dashboard becomes multi-tenant
- Onboarding flow: connect GitHub org → auto-scan repos → show coverage gaps
- This is the "SaaS-ification" path if Juan wants to go there
