# Memex

**Persistent, E2E encrypted memory for AI coding agents.**

Memex is an MCP server that gives Claude Code, Cursor, Windsurf, and any MCP-compatible tool persistent, encrypted memory across sessions. Every memory is AES-256-GCM encrypted before it touches disk.

## Quick Start

```bash
npx memex-mcp init
```

That's it. Your AI agent now has persistent memory.

## What It Does

Your AI agent gets 4 new tools:

| Tool | Description |
|------|-------------|
| `save_memory` | Save context with optional tags. Encrypted and stored locally. |
| `recall_memories` | Retrieve memories for the current project. Full-text search with BM25 ranking. |
| `search_memories` | Search across all projects. |
| `delete_memory` | Soft-delete a memory by ID. |

## How It Works

1. **Install** — `npx memex-mcp init` generates your encryption key, creates a local SQLite database, and registers the MCP server
2. **Your agent saves** — Architecture decisions, coding patterns, project context are stored as encrypted memories
3. **Your agent recalls** — Next session, different tool, the context is there

Memories are scoped to your git repo. Switch projects, get different memories.

## Security

- **AES-256-GCM** encryption with unique 12-byte IVs per memory
- **PBKDF2** key derivation (100K iterations, SHA-512) or random key mode
- **Local-first** — your encryption key never leaves your machine
- **Zero-knowledge** — no cloud, no accounts, no telemetry
- **Open source** — MIT licensed, audit every line

## Works With

- Claude Code
- Cursor
- Windsurf
- Any MCP-compatible tool

## Packages

| Package | Description |
|---------|-------------|
| [`memex-mcp`](./packages/memex-mcp) | MCP server + CLI ([npm](https://www.npmjs.com/package/memex-mcp)) |
| [`memex-landing`](./packages/landing) | Landing page ([memex.dev](https://memex.dev)) |

## Architecture

SQLite + FTS5 for storage and search. Single bundled file. 4 dependencies.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, encryption trade-offs, and data model.

## License

MIT
