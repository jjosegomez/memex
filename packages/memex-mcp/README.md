# memex-mcp

Persistent, E2E encrypted memory for AI coding agents.

Memex is an MCP server that gives Claude Code, Cursor, and any MCP-compatible tool shared, persistent memory across sessions. Every memory is AES-256-GCM encrypted before it touches disk.

## Quick Start

```bash
npx memex-mcp init
```

This generates your encryption key, creates a local SQLite database, and registers the MCP server with Claude Code. Done.

## What It Does

Your AI agent gets 4 new tools:

| Tool | Description |
|------|-------------|
| `save_memory` | Save context with optional tags. Encrypted and stored locally. |
| `recall_memories` | Retrieve memories for the current project. Full-text search with BM25 ranking. |
| `search_memories` | Search across all projects. |
| `delete_memory` | Soft-delete a memory by ID. |

## How It Works

1. **You install** — `npx memex-mcp init` (one command)
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

### Cursor Configuration

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "memex": {
      "command": "npx",
      "args": ["-y", "memex-mcp", "serve"]
    }
  }
}
```

## CLI

```bash
memex status                    # Check configuration
memex memories list             # List stored memories
memex memories search "auth"    # Full-text search
memex memories delete <id>      # Soft-delete a memory
memex key rotate                # Re-encrypt with new key
memex export                    # Export as JSON
```

## Requirements

- Node.js 20+
- macOS (arm64, x64) or Linux (x64)

## Architecture

SQLite + FTS5 for storage and search. Single bundled file. 4 dependencies.

The full architecture document covers encryption trade-offs, data model, and design decisions: [ARCHITECTURE.md](https://github.com/jjosegomez/memex/blob/main/ARCHITECTURE.md)

## Cloud Sync (Coming Soon)

E2E encrypted cloud sync — only encrypted blobs leave your machine. The FTS index stays local.

## License

MIT

## Links

- [GitHub](https://github.com/jjosegomez/memex)
- [Architecture](https://github.com/jjosegomez/memex/blob/main/ARCHITECTURE.md)
