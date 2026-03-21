# Memex

**Knowledge infrastructure for software agencies.**

Memex helps software agencies maintain institutional knowledge across teams, repos, and AI coding agents. It combines a persistent encrypted MCP memory server (the engine) with an agency knowledge dashboard (the product) that scans GitHub orgs, tracks knowledge health, and enforces standards.

## The Problem

Software agencies manage dozens of repos across client projects. Knowledge lives in developers' heads, scattered docs, and tribal memory. AI coding agents forget everything between sessions. When a developer leaves or switches projects, context is lost.

## The Solution

1. **MCP Memory Server** — Gives every AI coding agent (Claude Code, Cursor, Windsurf) persistent, encrypted memory across sessions. Architecture decisions, patterns, and context are saved and recalled automatically.
2. **Agency Knowledge Dashboard** — Scans your GitHub org for knowledge files (`CLAUDE.md`, `CONTEXT.md`, `PATTERNS.md`), scores each repo's knowledge health, and gives leadership visibility into documentation standards across the organization.

## Agency Dashboard

The dashboard connects to your GitHub org and provides:

- **Org-wide knowledge scanning** — Discovers all repos, checks for knowledge files
- **Health scores** — Rates each repo on knowledge completeness and freshness
- **Agency standards** — Define what "well-documented" means for your team, track compliance
- **Cross-repo search** — Full-text search across all knowledge files in the org
- **Dashboard overview** — Bird's-eye view of knowledge health across all repos

Built with Next.js 16, React 19, Tailwind 4, shadcn, and the Stitch "Digital Architect" design system.

## MCP Server Quick Start

```bash
npx memex-mcp init
```

That's it. Your AI agent now has persistent memory.

### What the MCP Server Does

Your AI agent gets 4 new tools:

| Tool | Description |
|------|-------------|
| `save_memory` | Save context with optional tags. Encrypted and stored locally. |
| `recall_memories` | Retrieve memories for the current project. Full-text search with BM25 ranking. |
| `search_memories` | Search across all projects. |
| `delete_memory` | Soft-delete a memory by ID. |

### Works With

- Claude Code
- Cursor
- Windsurf
- Any MCP-compatible tool

### Security

- **AES-256-GCM** encryption with unique 12-byte IVs per memory
- **PBKDF2** key derivation (100K iterations, SHA-512) or random key mode
- **Local-first** — your encryption key never leaves your machine
- **Zero-knowledge** — no cloud, no accounts, no telemetry
- **Open source** — MIT licensed, audit every line

## Packages

| Package | Description |
|---------|-------------|
| [`memex-dashboard`](./packages/dashboard) | Agency knowledge dashboard (Next.js 16 + React 19) |
| [`memex-mcp`](./packages/memex-mcp) | MCP server + CLI ([npm](https://www.npmjs.com/package/memex-mcp)) |
| [`memex-landing`](./packages/landing) | Marketing site ([getmemex.dev](https://getmemex.dev)) |

Service documentation lives in [`docs/service/`](./docs/service/).

## Architecture

The MCP server uses SQLite + FTS5 for storage and search. The dashboard uses Octokit to scan GitHub orgs for knowledge files.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, encryption trade-offs, and data model.

## License

MIT
