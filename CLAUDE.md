# CLAUDE.md - Memex

Memex is knowledge infrastructure for software agencies. It combines an MCP server (persistent, encrypted memory for AI coding agents) with an agency knowledge dashboard that scans GitHub orgs for knowledge files, tracks health scores, and enforces agency standards. First customer: Digital Bank.

## Architecture

Read `ARCHITECTURE.md` for the full system design. Key points:

- **Monorepo** with npm workspaces: `packages/memex-mcp` (MCP server + CLI), `packages/dashboard` (agency knowledge dashboard), and `packages/landing` (marketing site)
- **MCP server** communicates via stdio using `@modelcontextprotocol/sdk`
- **SQLite** via `better-sqlite3` for storage, with FTS5 for full-text search
- **AES-256-GCM** encryption using Node.js built-in `crypto` module
- **Single binary** — CLI and MCP server share the same entry point (`memex` command)

## Project Structure

```
packages/memex-mcp/     # MCP server + CLI (the engine)
  src/
    index.ts            # Entry point — CLI router via commander
    server.ts           # MCP server (McpServer, tool registration, stdio transport)
    tools/              # MCP tool handlers (save, recall, search, delete)
    db/                 # SQLite connection, queries, migrations
    crypto/             # AES-256-GCM encrypt/decrypt, key derivation, hashing
    cli/                # CLI command handlers (init, status, memories, key, export)
    lib/                # Utilities (project resolution, paths, ULID, config)
    types.ts            # Shared Zod schemas and TypeScript types
  tests/                # Vitest tests mirroring src/ structure

packages/dashboard/     # Agency Knowledge Dashboard (the product)
  src/
    app/                # Next.js 16 App Router pages
    components/         # UI components (shadcn + custom)
    lib/                # GitHub scanning, health scoring, utilities
  brand/                # Brand manual (Stitch "Digital Architect" design system)

packages/landing/       # Marketing site (Next.js 14)
  src/app/              # App Router pages
  components/           # Page sections

docs/service/           # Service documentation (from agent-setup-service)
  clients/              # Client-specific docs
  templates/            # Proposal/deliverable templates
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.4+ |
| MCP SDK | `@modelcontextprotocol/sdk` ^1.7 |
| Database | SQLite via `better-sqlite3` ^11 |
| Search | SQLite FTS5 (built-in) |
| Encryption | Node.js `crypto` (AES-256-GCM, PBKDF2) |
| CLI | `commander` ^12 |
| Validation | `zod` ^3.25 |
| Build | `tsup` ^8 |
| Tests | `vitest` ^3 |
| Dashboard | Next.js 16 + React 19 + Tailwind 4 + shadcn + Octokit |
| Landing | Next.js 14 + Tailwind + shadcn/ui |

## Commands

```bash
# Install dependencies (from repo root)
npm install

# Build the MCP server
npm run build -w packages/memex-mcp

# Run tests
npm test

# Dev mode (watch)
npm run dev -w packages/memex-mcp

# Type check
npm run typecheck -w packages/memex-mcp

# Dashboard dev (agency knowledge dashboard)
npm run dev -w packages/dashboard

# Landing page dev
npm run dev -w packages/landing

# Test MCP server manually (pipe JSON-RPC)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node packages/memex-mcp/dist/index.js serve
```

## Key Implementation Details

### MCP Server (`server.ts`)

- Uses `McpServer` from the SDK with `StdioServerTransport`
- Registers 4 tools: `save_memory`, `recall_memories`, `search_memories`, `delete_memory`
- Tool input schemas defined with Zod
- Tool handlers return `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
- Server is started only when `memex serve` is invoked

### Entry Point (`index.ts`)

- Has `#!/usr/bin/env node` shebang (tsup adds it via banner config)
- Uses commander to route: `serve` -> MCP server, all other commands -> CLI handlers
- Example: `memex init`, `memex serve`, `memex memories list`, `memex status`

### Database (`db/database.ts`)

- Uses `better-sqlite3` (synchronous API)
- Database path: `~/.local/share/memex/memex.db` (respects `XDG_DATA_HOME`)
- Schema initialized on first connection via migration system
- FTS5 virtual table `memories_fts` for full-text search
- All queries in `db/queries.ts` as prepared statements

### Encryption (`crypto/`)

- `encryption.ts`: `encryptContent(plaintext, key)` and `decryptContent(ciphertext, iv, authTag, key)`
- `keys.ts`: PBKDF2 key derivation, key file read/write, passphrase verification
- Key material stored at `~/.config/memex/key.enc` (respects `XDG_CONFIG_HOME`)
- Default mode: random key (no passphrase). Opt-in passphrase mode via `memex init --passphrase`
- Each memory has its own random 12-byte IV — NEVER reuse IVs

### Project Scope (`lib/project.ts`)

- Resolution order: explicit param > git root > cwd
- Uses `git rev-parse --show-toplevel` to detect git root
- Falls back to `process.cwd()` if not in a git repo

### IDs (`lib/ulid.ts`)

- ULID generation — inline implementation, no npm dependency
- Sortable by creation time, URL-safe

### FTS5 Search

- FTS5 table stores plaintext content for search capability
- Content is written to FTS in the same transaction as the encrypted insert
- Flow: plaintext -> write to FTS + encrypt -> write encrypted to memories table
- BM25 ranking for relevance scoring
- Tag filtering via `json_each()` on the JSON tags column

## Conventions

- **ESM only** — `"type": "module"` in package.json, use `.js` extensions in imports
- **No classes** — use plain functions and objects. No OOP patterns.
- **Errors** — throw descriptive Error instances. MCP tools catch and return `isError: true`.
- **No `any`** — use `unknown` and narrow with Zod or type guards
- **Tests** — use in-memory SQLite (`:memory:`) for unit tests, temp files for integration
- **Logging** — use `console.error()` for diagnostics (stdout is reserved for MCP JSON-RPC)

## npm Package

- Published as `memex-mcp` on npm
- `bin.memex` -> `./dist/index.js`
- `better-sqlite3` is external (not bundled — it's a native module)
- Everything else is bundled by tsup into a single file
- Users run: `npx memex-mcp init` then agents use: `npx -y memex-mcp serve`

## Encryption Trade-off (Important)

The FTS5 index stores plaintext content locally. This is necessary for search to work. The `content_enc` column stores AES-256-GCM encrypted content. For cloud sync (v2), only encrypted data will be synced — the FTS index stays local. This is documented in ARCHITECTURE.md Section 6.

## Claude Code Integration

After `memex init`, the MCP server is registered with Claude Code. Configuration goes to `~/.claude.json` via `claude mcp add`. The server runs as a child process communicating over stdio.

```json
{
  "mcpServers": {
    "memex": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "memex-mcp", "serve"]
    }
  }
}
```
