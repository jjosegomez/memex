# CONTEXT.md — Memex

> Living document. Updated at session end, read at session start.

## Current Phase
**Phase 2 built, pending deploy.** Auth (GitHub OAuth + JWT), org onboarding, CLAUDE.md auto-generation, client grouping — all coded and committed. Netlify credits exceeded, blocking deploy. 13 Playwright critical path tests passing.

## Last Updated
- **Date:** 2026-03-23
- **What changed:** Built all of Phase 2 — GitHub OAuth (Auth.js v5), login page, org onboarding flow, scanner refactor (session token), CLAUDE.md generation (Anthropic SDK → PR via Octokit), client grouping UI. Middleware doesn't work on Netlify's OpenNext runtime — switched to page-level requireAuth(). Deploy blocked by Netlify credit limit. Added 13 headed Playwright E2E tests.

## Architecture Overview
Monorepo with 3 packages. Core is an MCP server that provides encrypted persistent memory to AI coding agents.

```
AI Agent (Claude Code, Cursor, etc.)
  ↕ MCP Protocol (stdio, JSON-RPC)
Memex MCP Server (14 tools)
  ↕ better-sqlite3 (synchronous)
SQLite DB (~/.local/share/memex/memex.db)
  + FTS5 full-text search
  + AES-256-GCM encryption (all content)
```

**Monorepo packages:**
- `packages/memex-mcp` — MCP server + CLI (published to npm as `memex-mcp`)
- `packages/dashboard` — Agency knowledge dashboard (Next.js 16, React 19, Tailwind 4, shadcn). Scans GitHub orgs for CLAUDE.md/CONTEXT.md/PATTERNS.md. Deployed to memex-dashboard.netlify.app
- `packages/landing` — Marketing site (Next.js 14, to be rewritten for agency positioning in Phase 4)
- `docs/service/` — Proposals, specs, templates, playbook (from agent-setup-service)

## Key Decisions

### better-sqlite3 over async alternatives
- **Chose:** better-sqlite3 (synchronous)
- **Over:** sql.js, knex, prisma
- **Why:** No async complexity for crypto operations, embedded zero-config, FTS5 built-in
- **Date:** Feb 2026

### AES-256-GCM + PBKDF2 encryption
- **Chose:** Node.js built-in crypto
- **Over:** libsodium, keytar
- **Why:** Zero native dependencies for crypto, PBKDF2 with 100K iterations + SHA-512, unique IV per memory
- **Date:** Feb 2026

### FTS5 plaintext index
- **Chose:** SQLite FTS5 for search (plaintext)
- **Over:** Encrypted search, vector embeddings
- **Why:** Fast, accurate BM25 ranking, no ML dependencies. Acceptable for local-only MVP. Cloud sync v2 will encrypt differently.
- **Date:** Feb 2026

### ULID over UUID
- **Chose:** ULID (inline 10-line generator)
- **Over:** uuid package
- **Why:** Sortable by time, no external dependency
- **Date:** Feb 2026

### Heuristic extraction over LLM-only
- **Chose:** Hybrid: rule-based heuristics + optional LLM enrichment
- **Over:** LLM-only extraction
- **Why:** Works offline, fast, predictable. LLM adds optional depth when available.
- **Date:** Mar 2026

## What's Built & Stable
- **MCP Server:** 14 tools (memory CRUD, session recording, extraction, ingest, dashboard, health)
- **CLI:** 25+ subcommands (init, serve, memories, sessions, key rotate, export, dashboard)
- **Encryption:** AES-256-GCM, PBKDF2 key derivation, encrypted key file
- **Search:** FTS5 with BM25 ranking
- **Session Recording:** Passive capture layer (start/end/record events)
- **Extraction Pipeline:** Heuristic-based insight extraction + optional LLM
- **Auto-Ingest:** Discovers and parses Claude Code JSONL transcripts from `~/.claude/projects/`
- **Dashboard:** Web UI with overview stats, memory explorer, session list, project view
- **Landing Page:** getmemex.dev on Netlify
- **Tests:** 82 passing, TypeScript clean

## What's In Progress
- **Phase 1 COMPLETE** — Dashboard merged, deployed to Netlify
- **Phase 2 BUILT, PENDING DEPLOY** — All code committed. Blocked by Netlify credit limit (resets April 2).

## What's Next
1. **Deploy Phase 2** — top up Netlify credits or wait for reset, then deploy + test full OAuth flow live
2. **Phase 3 — "The Adoption"** (16-24h): Inline editing → PR, My Projects, onboarding view, health trends
3. **Phase 4 — Landing rewrite** (6-10h): Agency positioning on getmemex.dev
4. Schedule discovery session with Henry (Digital Bank)
5. Show HN (deferred — pivot first, launch after agency product is solid)

## Key Decisions (2026-03-21 Pivot)
- **Full agency pivot** — product is the dashboard, MCP server is the engine
- **Keep Next.js 16 + React 19** — resolved workspace conflicts via npm overrides
- **Auth.js v5 + JWT** — no database for auth (Phase 2)
- **Anthropic SDK** for auto-generating CLAUDE.md (Phase 2)
- **Netlify deployment** — memex-dashboard.netlify.app
- **Stitch "Digital Architect" design system** — dark monochrome + #22c55e green accent, Inter + Space Grotesk

## Known Tech Debt
- Landing page still on Next.js 14 / Tailwind 3 (Phase 4 rewrite)
- FTS5 index is plaintext (acceptable for local, needs encryption for cloud sync)
- No CI/CD pipeline — manual npm publish
- Need GitHub PAT on Netlify for live data (GITHUB_TOKEN + GITHUB_ORG)

## Known Gotchas
- **stdout is sacred:** MCP uses stdout for JSON-RPC. All logging must go to console.error, never console.log
- **better-sqlite3 is native:** Requires node-gyp build. Can fail on some systems. Only native dependency.
- **Key file location:** `~/.config/memex/key.enc` — if this is deleted, all encrypted data is unrecoverable
- **Project scoping:** Memories are scoped to git root. If not in a git repo, falls back to cwd. Can cause unexpected behavior.
- **Claude Code integration:** `memex init` writes to `~/.claude.json` — if this file is manually edited, the MCP config can break
- **Dashboard port:** Hardcoded to 3200 via `npm run dev -w packages/dashboard`
- **Netlify monorepo deploy:** Must use `--filter memex-dashboard` with the CLI. Without it, OpenNext adapter can't find the Next.js build output and all routes 404. Don't pin `@netlify/plugin-nextjs` in netlify.toml — let Netlify auto-detect.
- **Next.js 16 + monorepo lockfiles:** Next.js warns about inferring workspace root from `~/package-lock.json` (stale home dir lockfile). Set `turbopack.root` in next.config.ts if this causes issues.
- **Middleware doesn't work on Netlify:** Auth.js `auth()` wrapper and standard Next.js middleware both fail silently on Netlify's OpenNext runtime. Use page-level `requireAuth()` instead (in `src/lib/require-auth.ts`).
- **Netlify credit limits:** Free tier has a credit cap. Exceeding it returns "Forbidden" on all deploy attempts. Resets at billing cycle (first of month).

## Key Files
| File | Purpose |
|---|---|
| `packages/memex-mcp/src/index.ts` | CLI router (commander) |
| `packages/memex-mcp/src/server.ts` | MCP tool registration (14 tools) |
| `packages/memex-mcp/src/db/queries.ts` | Memory CRUD + FTS search |
| `packages/memex-mcp/src/db/session-queries.ts` | Session/event queries |
| `packages/memex-mcp/src/crypto/encryption.ts` | AES-256-GCM encrypt/decrypt |
| `packages/memex-mcp/src/sync/ingest.ts` | Auto-discover + parse session files |
| `packages/memex-mcp/src/extraction/pipeline.ts` | Insight extraction orchestration |
| `packages/dashboard/src/lib/github-scanner.ts` | GitHub org scanner (Octokit) |
| `packages/dashboard/src/lib/data-source.ts` | Local/GitHub mode abstraction |
| `packages/dashboard/IMPLEMENTATION_PLAN.md` | 4-phase build plan |
| `ARCHITECTURE.md` | Full system design (37KB, very detailed) |

## Development Workflow
```bash
# Build
npm run build -w packages/memex-mcp

# Test
npm test -w packages/memex-mcp        # 82 tests

# Dev (dashboard)
npm run dev -w packages/dashboard      # localhost:3200

# Manual MCP test
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node packages/memex-mcp/dist/index.js serve

# Publish
npm publish -w packages/memex-mcp
```

## Storage Paths
- Database: `~/.local/share/memex/memex.db`
- Key file: `~/.config/memex/key.enc`
- Agent config: `~/.claude.json` (MCP server registration)

## Team
| Name | Role | Focus |
|---|---|---|
| Juan | Solo builder + maintainer | Everything |
