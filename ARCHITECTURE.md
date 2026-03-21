# Memex Architecture Document

> Knowledge infrastructure for software agencies — persistent encrypted memory + agency knowledge dashboard.

**Version**: 2.0 (Agency Pivot)
**Author**: Architect Agent
**Date**: 2026-03-21 (updated from 2026-02-27)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [System Overview](#2-system-overview)
3. [Data Model](#3-data-model)
4. [MCP Tool Definitions](#4-mcp-tool-definitions)
5. [CLI Command Definitions](#5-cli-command-definitions)
6. [Encryption Architecture](#6-encryption-architecture)
7. [Integration Points](#7-integration-points)
8. [File Structure](#8-file-structure)
9. [npm Package Structure](#9-npm-package-structure)
10. [Landing Page Architecture](#10-landing-page-architecture)
11. [Build & Development](#11-build--development)
12. [Open Questions & Assumptions](#12-open-questions--assumptions)

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 20+ | Required by MCP SDK, LTS stability |
| **Language** | TypeScript 5.4+ | MCP SDK is TypeScript-native, type safety for crypto ops |
| **MCP SDK** | `@modelcontextprotocol/sdk` ^1.7 | Official SDK, handles protocol compliance, tool registration, stdio transport |
| **Database** | SQLite via `better-sqlite3` ^11 | Synchronous API (no async complexity), embedded, zero-config, FTS5 built-in |
| **Search** | SQLite FTS5 | Built into SQLite, no external deps, BM25 ranking, good enough for MVP. Avoids embedding models, API calls, or heavy ML deps. |
| **Encryption** | Node.js `crypto` (built-in) | AES-256-GCM, PBKDF2 key derivation, no external crypto deps |
| **Key Storage** | File-based encrypted key (XDG) | Avoids `keytar` (deprecated, native module headaches). Key file encrypted with user passphrase. Simpler, more portable. |
| **CLI Framework** | `commander` ^12 | De facto standard, tiny footprint, excellent TypeScript support |
| **Schema Validation** | `zod` ^3.25 | Required peer dep of MCP SDK, use it everywhere for consistency |
| **Build Tool** | `tsup` ^8 | Fast esbuild-based bundler, handles shebang injection, ESM output, single-file bundles |
| **Testing** | `vitest` ^3 | Fast, TypeScript-native, compatible with ESM modules |
| **Dashboard** | Next.js 16 + React 19 + Tailwind 4 + shadcn + Octokit | Agency knowledge dashboard — scans GitHub orgs for knowledge files, health scoring |
| **Landing Page** | Next.js 14 (App Router) + Tailwind + shadcn/ui | Marketing site |
| **Monorepo** | npm workspaces | Simple, no extra tooling (no turborepo needed for 3 packages) |

### Why NOT These Alternatives

| Rejected | Reason |
|----------|--------|
| **Embedding models** (transformers.js, local LLM) | 200MB+ download, slow startup, overkill for MVP. FTS5 handles keyword search well. Embeddings are a v2 feature. |
| **keytar** for key storage | Deprecated, native module (node-gyp), fails on many systems. File-based key with passphrase encryption is simpler and more portable. |
| **Prisma** for SQLite | Overkill for 2 tables. `better-sqlite3` is simpler, synchronous, and gives direct FTS5 access. |
| **turborepo** for monorepo | Only 3 small packages, npm workspaces sufficient. |
| **drizzle-orm** | Adds abstraction layer over what's ~10 SQL statements. Not worth the dep. |

---

## 2. System Overview

### Architecture Diagram (Text)

```
+-------------------+     stdio      +-------------------+
|   Claude Code     | <============> |   Memex MCP       |
|   (or Cursor,     |    JSON-RPC    |   Server          |
|    Copilot, etc)  |                |                   |
+-------------------+                | +---------+       |
                                     | | Encrypt |       |
                                     | | Layer   |       |
                                     | +----+----+       |
                                     |      |            |
                                     | +----v----+       |
                                     | | SQLite  |       |
                                     | | + FTS5  |       |
                                     | +---------+       |
                                     +-------------------+

+-------------------+
|   Memex CLI       |  (same SQLite DB, same encryption)
|   `memex init`    |
|   `memex list`    |
|   `memex search`  |
+-------------------+

+-------------------+
|   Agency Dashboard|  (Next.js 16 + React 19 + Tailwind 4 + shadcn)
|   Knowledge Hub   |  Scans GitHub orgs via Octokit for CLAUDE.md,
|   packages/       |  CONTEXT.md, PATTERNS.md. Shows health scores,
|   dashboard/      |  agency standards, cross-repo search.
+-------------------+

+-------------------+
|   Landing Page    |  (separate Next.js app, no backend connection)
|   getmemex.dev    |
+-------------------+
```

### Data Flow: Saving a Memory

1. AI agent calls `save_memory` MCP tool with `{ content, tags?, project? }`
2. MCP server resolves project scope (git root or cwd)
3. Content is encrypted with AES-256-GCM using the derived encryption key
4. Tags and a plaintext `content_hash` (for dedup) are stored
5. Encrypted content + metadata inserted into SQLite
6. FTS5 index updated with plaintext content (FTS table is also encrypted at rest -- see Section 6)
7. Tool returns `{ id, project, tags, created_at }`

### Data Flow: Recalling Memories

1. AI agent calls `recall_memories` with `{ query, project?, tags?, limit? }`
2. MCP server resolves project scope
3. Query hits FTS5 index (BM25 ranking) with optional tag/project filters
4. Matching rows fetched, content decrypted
5. Decrypted memories returned to agent

---

## 3. Data Model

### SQLite Schema

```sql
-- Main memories table
CREATE TABLE IF NOT EXISTS memories (
    id              TEXT PRIMARY KEY,    -- ULID (sortable, unique, no UUID deps)
    project         TEXT NOT NULL,       -- git repo root path or cwd
    content_enc     BLOB NOT NULL,       -- AES-256-GCM encrypted content
    iv              BLOB NOT NULL,       -- 12-byte initialization vector (unique per row)
    auth_tag        BLOB NOT NULL,       -- 16-byte GCM authentication tag
    tags            TEXT DEFAULT '[]',   -- JSON array of tags (plaintext for filtering)
    content_hash    TEXT NOT NULL,       -- SHA-256 of plaintext content (for dedup)
    created_at      TEXT NOT NULL,       -- ISO 8601 timestamp
    updated_at      TEXT NOT NULL,       -- ISO 8601 timestamp
    deleted_at      TEXT DEFAULT NULL    -- soft delete timestamp
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_memories_hash ON memories(content_hash);

-- FTS5 virtual table for full-text search
-- NOTE: This stores plaintext content for search. The entire SQLite database
-- file can be encrypted at the filesystem level if additional security is needed.
-- For MVP, the FTS index contains plaintext to enable search. This is acceptable
-- because the DB file lives on the user's local machine only.
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    id UNINDEXED,       -- link back to memories table
    content,            -- plaintext content for search
    tags,               -- tags for search
    project UNINDEXED,  -- project scope (not searched, used for filtering)
    content='memories', -- external content table
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(id, content, tags, project)
    VALUES (new.id, '', new.tags, new.project);
END;

-- Note: FTS content column will be populated with plaintext at insert time
-- via application code, not via trigger (since the trigger can't decrypt)

-- Metadata table for config/state
CREATE TABLE IF NOT EXISTS meta (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);
```

### Design Decisions for the Schema

**ULID for IDs**: ULIDs are sortable by creation time, URL-safe, and don't require the `uuid` package. Generated with a tiny inline function (no dep needed -- 10 lines of code).

**Soft deletes**: `deleted_at` instead of hard delete. Allows undo, and the MCP `delete_memory` tool sets this field. A CLI `memex purge` can hard-delete later.

**Tags as JSON array in TEXT column**: For MVP simplicity. Tags are searchable via FTS5 and filterable via `json_each()` in SQLite. No need for a junction table.

**FTS5 external content**: The FTS index references the memories table. Plaintext content is inserted into FTS at write time via application code (not triggers), because the trigger would only see the encrypted blob. The application decrypts nothing -- it writes plaintext to FTS before encrypting for the main table, in a single transaction.

**Content hash**: SHA-256 of plaintext. Used to detect duplicates before inserting. If an agent tries to save the same memory twice, we skip it and return the existing ID.

### FTS5 and Encryption Trade-off

This is the key architectural trade-off in the MVP:

- The `memories` table stores **encrypted** content (only ciphertext in `content_enc`)
- The `memories_fts` table stores **plaintext** content (required for FTS5 to work)
- Both live in the same SQLite file on the user's local machine

**Why this is acceptable for MVP**:
1. The SQLite file is local-only (no cloud sync in MVP)
2. The file is stored in the user's home directory with standard file permissions
3. The encryption is designed for future cloud sync where the server would only see `content_enc`, `iv`, and `auth_tag` -- never the FTS table
4. For users who want full disk-level protection, they can use FileVault/LUKS (OS-level encryption)

**v2 improvement path**: When cloud sync is added, only the `memories` table rows (encrypted fields) would be synced. The FTS index stays local. This gives us E2E encryption for sync while keeping search fast locally.

---

## 4. MCP Tool Definitions

### Tool: `save_memory`

Saves a new memory. Deduplicates by content hash.

```typescript
// Input Schema (Zod)
z.object({
  content: z.string()
    .min(1)
    .max(50000)
    .describe("The content to remember. Can be code, context, decisions, patterns, or any text."),
  tags: z.array(z.string().max(50))
    .max(20)
    .optional()
    .default([])
    .describe("Optional tags for categorization. E.g., ['architecture', 'auth', 'bug-fix']"),
  project: z.string()
    .optional()
    .describe("Project identifier. Defaults to git repo root or current working directory."),
})

// Output (on success)
{
  content: [{
    type: "text",
    text: JSON.stringify({
      id: "01HXYZ...",           // ULID
      project: "/Users/juan/code/myapp",
      tags: ["architecture", "auth"],
      created_at: "2026-02-27T10:30:00.000Z",
      duplicate: false           // true if content already existed
    })
  }]
}

// Output (on duplicate)
{
  content: [{
    type: "text",
    text: JSON.stringify({
      id: "01HABC...",           // existing memory ID
      project: "/Users/juan/code/myapp",
      tags: ["architecture"],
      created_at: "2026-02-25T08:00:00.000Z",
      duplicate: true
    })
  }]
}
```

### Tool: `recall_memories`

Retrieves memories for the current project, optionally filtered by query/tags.

```typescript
// Input Schema (Zod)
z.object({
  query: z.string()
    .max(500)
    .optional()
    .describe("Search query. Uses full-text search with BM25 ranking. If omitted, returns recent memories."),
  tags: z.array(z.string())
    .optional()
    .describe("Filter by tags. Returns memories matching ANY of the provided tags."),
  project: z.string()
    .optional()
    .describe("Project identifier. Defaults to git repo root or current working directory."),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe("Maximum number of memories to return."),
})

// Output
{
  content: [{
    type: "text",
    text: JSON.stringify({
      memories: [
        {
          id: "01HXYZ...",
          content: "The auth system uses JWT with refresh tokens...",
          tags: ["auth", "architecture"],
          project: "/Users/juan/code/myapp",
          created_at: "2026-02-27T10:30:00.000Z",
          relevance: 0.95          // BM25 score (only present if query provided)
        }
      ],
      total: 42,                   // total memories for this project
      returned: 10
    })
  }]
}
```

### Tool: `search_memories`

Cross-project search. Unlike `recall_memories`, this searches across ALL projects.

```typescript
// Input Schema (Zod)
z.object({
  query: z.string()
    .min(1)
    .max(500)
    .describe("Search query. Uses full-text search across all projects."),
  tags: z.array(z.string())
    .optional()
    .describe("Filter by tags."),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe("Maximum number of memories to return."),
})

// Output (same shape as recall_memories but with cross-project results)
{
  content: [{
    type: "text",
    text: JSON.stringify({
      memories: [
        {
          id: "01HXYZ...",
          content: "Pattern: use repository pattern for data access...",
          tags: ["patterns"],
          project: "/Users/juan/code/other-app",
          created_at: "2026-02-20T15:00:00.000Z",
          relevance: 0.88
        }
      ],
      total: 156,                  // total across all projects
      returned: 10
    })
  }]
}
```

### Tool: `delete_memory`

Soft-deletes a memory by ID.

```typescript
// Input Schema (Zod)
z.object({
  id: z.string()
    .describe("The memory ID (ULID) to delete."),
})

// Output
{
  content: [{
    type: "text",
    text: JSON.stringify({
      deleted: true,
      id: "01HXYZ..."
    })
  }]
}

// Output (not found)
{
  content: [{
    type: "text",
    text: JSON.stringify({
      deleted: false,
      error: "Memory not found"
    })
  }],
  isError: true
}
```

### MCP Server Metadata

```typescript
const server = new McpServer({
  name: "memex",
  version: "0.1.0",  // from package.json
});
```

The server registers all 4 tools and exposes them via stdio transport. No resources or prompts are registered for MVP.

---

## 5. CLI Command Definitions

### `npx memex init`

Interactive setup. Generates encryption key, configures Claude Code MCP settings.

```
$ npx memex init

Memex - AI Memory for Developers
=================================

Step 1/3: Encryption Setup
  Enter a passphrase (min 8 chars): ********
  Confirm passphrase: ********
  Key derived and saved to ~/.config/memex/key.enc

Step 2/3: Database
  Database location: ~/.local/share/memex/memex.db
  Database created.

Step 3/3: Claude Code Integration
  Detected Claude Code installation.
  Added memex MCP server to Claude Code settings.

  You can also add to other agents:
    claude mcp add memex --transport stdio -- npx memex serve

Setup complete! Memex is ready.
  - Your AI agents will now remember context across sessions.
  - Run 'memex status' to check configuration.
  - Run 'memex memories list' to see stored memories.
```

**What `init` does internally**:
1. Prompts for passphrase (or generates random key if `--no-passphrase` flag)
2. Derives encryption key via PBKDF2 (100,000 iterations, SHA-512)
3. Stores encrypted key material in `~/.config/memex/key.enc` (XDG config)
4. Creates SQLite database at `~/.local/share/memex/memex.db` (XDG data)
5. Runs `CREATE TABLE` and `CREATE VIRTUAL TABLE` statements
6. Detects Claude Code and writes to `.claude.json` or runs `claude mcp add`

### `memex serve`

Starts the MCP server on stdio. Not intended for direct human use -- invoked by AI agents.

```
$ memex serve
# (blocks, communicating via stdin/stdout JSON-RPC)
```

### `memex status`

Shows configuration status.

```
$ memex status

Memex Status
============
  Encryption: Configured (AES-256-GCM)
  Database:   ~/.local/share/memex/memex.db (2.3 MB, 142 memories)
  Projects:   3 projects tracked
    - /Users/juan/code/myapp (89 memories)
    - /Users/juan/code/api (42 memories)
    - /Users/juan/code/landing (11 memories)
  Claude Code: Connected (MCP server registered)
```

### `memex memories list`

Lists memories, optionally filtered.

```
$ memex memories list
$ memex memories list --project /path/to/project
$ memex memories list --tag architecture
$ memex memories list --limit 5

ID              Created     Tags              Preview
01HXY...ABC    2h ago      auth,jwt          The auth system uses JWT with...
01HXY...DEF    1d ago      architecture      We decided to use the reposit...
01HXY...GHI    3d ago      bug-fix           Fixed the race condition in...
```

### `memex memories search`

Full-text search across all projects.

```
$ memex memories search "authentication pattern"

Found 3 results across 2 projects:

[0.95] 01HXY...ABC  myapp      auth,jwt          The auth system uses JWT...
[0.82] 01HXY...DEF  api        architecture      Auth middleware pattern...
[0.71] 01HXY...GHI  landing    security          OAuth flow for landing...
```

### `memex memories delete <id>`

Soft-deletes a memory.

```
$ memex memories delete 01HXYABC
Memory 01HXYABC deleted.
```

### `memex memories purge`

Hard-deletes all soft-deleted memories (permanent).

```
$ memex memories purge
3 memories permanently deleted.
```

### `memex key rotate`

Re-encrypts all memories with a new key (for passphrase changes).

```
$ memex key rotate
Enter current passphrase: ********
Enter new passphrase: ********
Confirm new passphrase: ********
Re-encrypting 142 memories... done.
Key rotated successfully.
```

### `memex export`

Exports memories as JSON (plaintext). For backup or migration.

```
$ memex export > memories-backup.json
$ memex export --project /path/to/project > project-memories.json
```

### CLI Architecture

The CLI binary (`memex`) and the MCP server (`memex serve`) share the same codebase. The entry point detects whether it's being invoked as a CLI or as an MCP server:

```
memex init     -> CLI mode -> init command
memex serve    -> MCP mode -> start stdio server
memex memories -> CLI mode -> memory management
memex *        -> CLI mode -> various commands
```

This means a single npm package, single binary, single `bin` entry in package.json.

---

## 6. Encryption Architecture

### Overview

```
Passphrase (user-provided)
    |
    v
PBKDF2(passphrase, salt, 100000, 64, 'sha512')
    |
    v
Master Key (32 bytes for AES-256 + 32 bytes for HMAC)
    |
    +--> AES-256-GCM Key (first 32 bytes)
    |
    +--> HMAC Key (last 32 bytes, for key verification)
```

### Key Derivation

```typescript
interface KeyMaterial {
  salt: Buffer;           // 32 random bytes, generated once at init
  iterations: number;     // 100,000 (configurable, stored in meta)
  encryptedKey: Buffer;   // The derived key, encrypted with itself for verification
  verificationTag: Buffer; // HMAC of a known string, to verify passphrase correctness
}
```

**Process**:
1. At `memex init`: generate 32-byte random salt
2. Derive 64 bytes from passphrase using PBKDF2-SHA512
3. First 32 bytes = AES key, last 32 bytes = HMAC key
4. HMAC the string "memex-key-verification" with the HMAC key
5. Store `{ salt, iterations, verificationTag }` in `~/.config/memex/key.enc` (JSON)
6. The AES key is NEVER stored on disk. It's re-derived from the passphrase each time.

**At runtime** (when MCP server starts or CLI runs):
1. Read salt and iterations from `key.enc`
2. Read passphrase from environment variable `MEMEX_PASSPHRASE` (for MCP server)
   or prompt interactively (for CLI)
3. Re-derive the 64-byte key material
4. Verify correctness by checking HMAC matches `verificationTag`
5. Use the AES key for encrypt/decrypt operations

### No-Passphrase Mode

For users who don't want to enter a passphrase each time:

1. At `memex init --no-passphrase`: generate a random 32-byte key
2. Store the raw key in `~/.config/memex/key.enc` with a flag `{ mode: "raw" }`
3. The key is protected only by filesystem permissions (`chmod 600`)
4. This is less secure but acceptable for local-only use

### Per-Memory Encryption

Each memory is encrypted independently:

```typescript
function encryptContent(plaintext: string, key: Buffer): {
  iv: Buffer;        // 12 random bytes
  ciphertext: Buffer;
  authTag: Buffer;   // 16 bytes
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  return {
    iv,
    ciphertext: encrypted,
    authTag: cipher.getAuthTag()
  };
}

function decryptContent(
  ciphertext: Buffer, iv: Buffer, authTag: Buffer, key: Buffer
): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}
```

### What's Encrypted vs. Plaintext

| Field | Encrypted? | Reason |
|-------|-----------|--------|
| `content_enc` | YES | Primary content, sensitive |
| `iv` | No (needed for decryption) | Not sensitive |
| `auth_tag` | No (needed for verification) | Not sensitive |
| `tags` | No | Needed for filtering without decryption. Tags are user-chosen labels, low sensitivity. |
| `content_hash` | No | SHA-256, one-way, needed for dedup |
| `project` | No | Path string, needed for scoping |
| `created_at/updated_at` | No | Timestamps, needed for ordering |
| FTS5 content | **Plaintext** (local-only) | Required for full-text search to work |

### Passphrase Delivery to MCP Server

The MCP server runs as a child process spawned by Claude Code. It needs the encryption key at startup. Options:

1. **Environment variable** `MEMEX_PASSPHRASE`: Set in the MCP server config. Claude Code passes env vars to child processes. This is the primary method.
2. **No-passphrase mode**: Key read directly from `key.enc` file. No env var needed.
3. **OS keychain** (v2): Future enhancement using native keychain APIs.

The Claude Code MCP configuration would look like:

```json
{
  "mcpServers": {
    "memex": {
      "command": "npx",
      "args": ["-y", "memex-mcp", "serve"],
      "env": {
        "MEMEX_PASSPHRASE": "user-sets-this"
      }
    }
  }
}
```

Or for no-passphrase mode (simpler, recommended for MVP):

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

### Security Properties

- **Confidentiality**: Content is AES-256-GCM encrypted at rest
- **Integrity**: GCM auth tag prevents tampering
- **Key derivation**: PBKDF2 with 100k iterations resists brute force
- **IV uniqueness**: Random 12-byte IV per memory, never reused
- **Forward secrecy**: Not applicable (symmetric encryption, no session keys)
- **Local-only MVP**: Database file only on user's machine

---

## 7. Integration Points

### Claude Code Integration

**How the MCP server connects to Claude Code:**

Claude Code spawns MCP servers as child processes communicating over stdio (stdin/stdout). The protocol is JSON-RPC 2.0.

**Configuration method**: `memex init` writes to Claude Code's configuration by running:

```bash
claude mcp add memex --transport stdio --scope local -- npx -y memex-mcp serve
```

Or by directly writing to `~/.claude.json`:

```json
{
  "mcpServers": {
    "memex": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "memex-mcp", "serve"],
      "env": {}
    }
  }
}
```

**Alternative: Project-level config** via `.mcp.json` at project root:

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

### Project Scope Resolution

The MCP server needs to know which project it's serving. Resolution order:

1. Explicit `project` parameter passed by the agent in the tool call
2. Git repo root of the current working directory (run `git rev-parse --show-toplevel`)
3. Current working directory as fallback

The CWD is inherited from the parent process (Claude Code), which sets it to the project root.

```typescript
async function resolveProject(explicit?: string): Promise<string> {
  if (explicit) return path.resolve(explicit);

  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return gitRoot;
  } catch {
    return process.cwd();
  }
}
```

### Cursor Integration (Future, but architecture supports it)

Cursor also supports MCP servers. The configuration goes in `.cursor/mcp.json`:

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

No code changes needed -- the same MCP server binary works.

### Data Directory Layout (XDG-compliant)

```
~/.config/memex/
    key.enc           # Key material (salt, iterations, verification)
    config.json       # User preferences (optional, future)

~/.local/share/memex/
    memex.db          # SQLite database (memories + FTS index)
```

On macOS, `~/.config` and `~/.local/share` are used directly (XDG convention works on macOS even without XDG_* env vars set). The code should respect `XDG_CONFIG_HOME` and `XDG_DATA_HOME` if set.

---

## 8. File Structure

```
memex/                              # Repository root
├── packages/
│   ├── memex-mcp/                  # Main package (MCP server + CLI)
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point: CLI router (commander setup)
│   │   │   ├── server.ts           # MCP server setup (McpServer, tool registration, stdio)
│   │   │   ├── tools/
│   │   │   │   ├── save-memory.ts  # save_memory tool handler
│   │   │   │   ├── recall-memories.ts  # recall_memories tool handler
│   │   │   │   ├── search-memories.ts  # search_memories tool handler
│   │   │   │   └── delete-memory.ts    # delete_memory tool handler
│   │   │   ├── db/
│   │   │   │   ├── database.ts     # SQLite connection, schema init, migrations
│   │   │   │   ├── queries.ts      # All SQL queries (insert, search, delete, etc.)
│   │   │   │   └── migrations.ts   # Schema versioning (simple version table)
│   │   │   ├── crypto/
│   │   │   │   ├── encryption.ts   # AES-256-GCM encrypt/decrypt functions
│   │   │   │   ├── keys.ts         # Key derivation (PBKDF2), key file read/write
│   │   │   │   └── hash.ts         # SHA-256 content hashing
│   │   │   ├── cli/
│   │   │   │   ├── init.ts         # `memex init` command implementation
│   │   │   │   ├── status.ts       # `memex status` command
│   │   │   │   ├── memories.ts     # `memex memories list|search|delete|purge`
│   │   │   │   ├── key.ts          # `memex key rotate`
│   │   │   │   └── export.ts       # `memex export`
│   │   │   ├── lib/
│   │   │   │   ├── project.ts      # Project scope resolution (git root / cwd)
│   │   │   │   ├── paths.ts        # XDG-compliant path resolution
│   │   │   │   ├── ulid.ts         # ULID generation (inline, no deps)
│   │   │   │   └── config.ts       # Config file read/write helpers
│   │   │   └── types.ts            # Shared types and Zod schemas
│   │   ├── tests/
│   │   │   ├── tools/
│   │   │   │   ├── save-memory.test.ts
│   │   │   │   ├── recall-memories.test.ts
│   │   │   │   ├── search-memories.test.ts
│   │   │   │   └── delete-memory.test.ts
│   │   │   ├── crypto/
│   │   │   │   ├── encryption.test.ts
│   │   │   │   └── keys.test.ts
│   │   │   ├── db/
│   │   │   │   └── queries.test.ts
│   │   │   └── cli/
│   │   │       └── init.test.ts
│   │   ├── tsconfig.json           # TypeScript config
│   │   ├── tsup.config.ts          # Build config (single bundle, shebang)
│   │   ├── vitest.config.ts        # Test config
│   │   ├── package.json            # Package manifest
│   │   └── README.md               # Package README (for npm)
│   │
│   ├── dashboard/                  # Agency Knowledge Dashboard (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/                # App Router pages
│   │   │   ├── components/         # UI components (shadcn + custom)
│   │   │   └── lib/                # GitHub scanning, health scoring, utilities
│   │   ├── brand/                  # Brand manual (HTML)
│   │   │   ├── brand-manual.html
│   │   │   └── brand-manual-v2.html
│   │   ├── public/                 # Static assets
│   │   ├── components.json         # shadcn configuration
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json            # Next.js 16, React 19, Tailwind 4, Octokit, shadcn
│   │
│   └── landing/                    # Landing page (Next.js 14)
│       ├── src/app/                # App Router pages
│       ├── components/             # Page sections
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docs/
│   └── service/                    # Service documentation (from agent-setup-service)
│       ├── clients/                # Client-specific docs
│       ├── docs/                   # Internal service docs
│       ├── templates/              # Proposal/deliverable templates
│       ├── dashboard-spec.md       # Dashboard specification
│       ├── discovery-questionnaire.md
│       └── proposal-template.md
│
├── package.json                    # Root workspace config
├── tsconfig.base.json              # Shared TypeScript config
├── .gitignore
├── LICENSE                         # MIT
├── README.md                       # Project README
├── ARCHITECTURE.md                 # This document
└── CLAUDE.md                       # Claude Code project instructions
```

### File Count: ~45 files

This is intentionally minimal. Each file has a single responsibility. The MCP server and CLI live in the same package to share code (db, crypto, types).

---

## 9. npm Package Structure

### Package Name: `memex-mcp`

Published to npm as a single package. The `memex` name is taken.

### `package.json` (memex-mcp)

```json
{
  "name": "memex-mcp",
  "version": "0.1.0",
  "description": "Portable, E2E encrypted AI memory for developers. MCP server + CLI.",
  "type": "module",
  "bin": {
    "memex": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.7.0",
    "better-sqlite3": "^11.0.0",
    "commander": "^12.0.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "keywords": [
    "mcp",
    "ai",
    "memory",
    "claude",
    "cursor",
    "encrypted",
    "developer-tools"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/jjosegomez/memex"
  }
}
```

### tsup Configuration

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,            // No type declarations needed (CLI/server, not a library)
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    'better-sqlite3',   // Native module, can't be bundled
  ],
  noExternal: [
    '@modelcontextprotocol/sdk',  // Bundle the SDK
    'commander',
    'zod',
  ],
});
```

### What Gets Published

```
memex-mcp/
├── dist/
│   ├── index.js          # Single bundled file (~100KB estimated)
│   └── index.js.map      # Source map
├── README.md
├── LICENSE
└── package.json
```

The `better-sqlite3` native module is an `external` dependency -- it gets installed from npm normally (with its prebuilt binaries). Everything else is bundled into a single `index.js`.

### Installation & Execution

```bash
# One-time setup
npx memex-mcp init

# Or install globally
npm install -g memex-mcp
memex init

# Claude Code auto-runs via:
npx -y memex-mcp serve
```

---

## 10. Agency Knowledge Dashboard

The dashboard (`packages/dashboard/`) is the primary product surface. It is a Next.js 16 app that provides knowledge visibility and health tracking for software agencies.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind 4 + shadcn |
| GitHub API | Octokit ^5 |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Design System | Stitch "Digital Architect" |

### Core Features

1. **GitHub Org Scanning** — Connects to a GitHub org via Octokit, discovers all repos, and scans for knowledge files (`CLAUDE.md`, `CONTEXT.md`, `PATTERNS.md`)
2. **Knowledge Health Scores** — Rates each repo on knowledge completeness (are the files present? up-to-date? following standards?)
3. **Agency Standards** — Define what a "well-documented repo" looks like for the agency, track compliance across the org
4. **Cross-Repo Search** — Full-text search across all knowledge files in the org
5. **Dashboard Overview** — Bird's-eye view of the agency's knowledge health across all repos

### Design System

The dashboard uses the Stitch "Digital Architect" design system. Brand manual lives in `packages/dashboard/brand/`.

### Deployment

Netlify. Configuration in `packages/dashboard/netlify.toml`.

### First Customer

Digital Bank (software agency).

---

## 10b. Landing Page Architecture

The landing page is a separate Next.js 14 app in `packages/landing/`. It has no backend and no connection to the MCP server. It serves as the marketing site for the MCP server package.

### Deployment

Vercel. Auto-deploys from `packages/landing/` directory.

---

## 11. Build & Development

### Monorepo Structure

```json
// Root package.json
{
  "name": "memex",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspace=packages/memex-mcp",
    "dev": "npm run dev --workspace=packages/memex-mcp",
    "dev:landing": "npm run dev --workspace=packages/landing",
    "dev:dashboard": "npm run dev --workspace=packages/dashboard"
  }
}
```

### Development Workflow

```bash
# Install all deps
npm install

# Build the MCP server
npm run build -w packages/memex-mcp

# Run tests
npm test

# Test the MCP server locally
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node packages/memex-mcp/dist/index.js serve

# Test with Claude Code (after building)
claude mcp add memex --transport stdio --scope local -- node /absolute/path/to/packages/memex-mcp/dist/index.js serve

# Start dashboard dev server
npm run dev:dashboard

# Start landing page dev server
npm run dev:landing
```

### Testing Strategy

- **Unit tests**: Crypto functions (encrypt/decrypt round-trip, key derivation), ULID generation, path resolution
- **Integration tests**: SQLite operations (insert, search, FTS5), tool handlers (mock MCP context)
- **E2E test**: Full flow -- init, save memory via MCP tool, recall it, delete it. Uses a temp SQLite DB.
- **No snapshot tests**: Everything is data-driven, no UI in the main package

Tests use in-memory SQLite (`:memory:`) where possible, temp files for integration tests that need disk persistence.

---

## 12. Open Questions & Assumptions

### Assumptions Made

1. **npm package name `memex-mcp` is available**: Verified -- it is. Alternate: `@memex-ai/server`.
2. **Claude Code is primary target**: MVP only needs to work with Claude Code. Cursor/Copilot compatibility comes from MCP compliance, no extra work needed.
3. **No-passphrase mode is the default for MVP**: Most developers won't want to enter a passphrase every time their agent starts. The `init` command defaults to generating a random key stored in a protected file. Passphrase mode is opt-in.
4. **FTS5 plaintext trade-off is acceptable**: Local-only database, FTS5 requires plaintext. Documented clearly.
5. **Single SQLite file for all projects**: One database, project-scoped via the `project` column. Simpler than per-project databases.
6. **better-sqlite3 prebuilt binaries work**: They cover macOS (arm64 + x64) and Linux (x64). No Windows in MVP scope.

### Open Questions

1. **Package name preference**: `memex-mcp` vs `@memex-ai/server` vs `memex-ai`? I've defaulted to `memex-mcp` (descriptive, available, no npm org needed).

2. **Landing page domain**: `memex.dev`? `memex-ai.dev`? `getmemex.dev`? Needs domain availability check.

3. **Email capture service**: Resend, Buttondown, or just a Google Form? Depends on what Juan already has accounts for.

4. **GitHub org**: Publish under `juanjgomez/memex` or create a `memex-ai` org? Affects package scope.

5. **Max memory size**: I've set 50KB per memory (50,000 chars). Is this enough? AI agents sometimes dump large context. Could increase to 200KB.

6. **Telemetry**: Should we add opt-in anonymous usage tracking (just counts, no content) for understanding adoption? Not in MVP scope, but worth deciding early.

7. **Auto-save behavior**: Should the MCP server description hint to agents to proactively save context, or wait for explicit instructions? This is a UX/prompt-engineering question.

---

## Appendix: ULID Implementation

No npm dependency needed. Inline implementation (~15 lines):

```typescript
// ULID: Universally Unique Lexicographically Sortable Identifier
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulid(): string {
  const now = Date.now();
  let str = '';

  // Timestamp (10 chars, 48-bit millisecond precision)
  let t = now;
  for (let i = 9; i >= 0; i--) {
    str = ENCODING[t % 32] + str;
    t = Math.floor(t / 32);
  }

  // Randomness (16 chars, 80-bit)
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    str += ENCODING[bytes[i] % 32];
  }

  return str;
}
```

---

## Appendix: Migration Strategy

For MVP, migrations are simple version checks:

```typescript
const CURRENT_SCHEMA_VERSION = 1;

function migrate(db: Database): void {
  const version = getSchemaVersion(db); // reads from meta table

  if (version < 1) {
    db.exec(SCHEMA_V1); // CREATE TABLE memories, memories_fts, meta
    setSchemaVersion(db, 1);
  }

  // Future: if (version < 2) { ... }
}
```

No migration framework needed for MVP. The version number is stored in the `meta` table.
