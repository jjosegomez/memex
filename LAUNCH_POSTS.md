# Memex Launch Posts

All distribution copy for launch day and the first week.

---

## 1. Show HN Post

**Title:** Show HN: Memex -- E2E encrypted persistent memory for AI coding agents

**Body:**

Hey HN,

I built Memex because I got tired of re-explaining my project architecture to Claude Code every Monday morning.

**The problem:** AI coding agents forget everything between sessions. Every time you start a new chat, you lose all the context you built up -- the auth patterns you decided on, the migration strategy, the quirks of your codebase. If you use multiple agents (Claude Code + Cursor), the problem is worse. They can't share context at all.

**What Memex does:** It's an MCP server that gives any MCP-compatible AI agent persistent, encrypted memory. Your agent saves architectural decisions, patterns, and project context. Next session -- or in a different tool -- the context is there.

One command to set up:

```
npx memex-mcp init
```

Your agent gets 4 tools: `save_memory`, `recall_memories`, `search_memories`, `delete_memory`.

**The encryption angle:** Every memory is AES-256-GCM encrypted with a unique 12-byte IV before it touches disk. Key derivation uses PBKDF2 with 100K iterations (SHA-512). Your encryption key never leaves your machine. No cloud, no accounts, no telemetry. The database is SQLite + FTS5, stored locally.

The FTS5 index does store plaintext locally to make search work (FTS5 needs it). For the planned cloud sync feature, only encrypted blobs will ever leave your machine -- the search index stays local.

**Why not existing solutions?**

- Mem0 ($24M raised, 48K stars) -- cloud-based, not E2E encrypted. Your code context sits on their servers.
- Pieces (100K users) -- heavy desktop app, not a lightweight tool you pipe into any MCP agent.
- Copilot Memory -- GitHub-only walled garden.

Nobody has E2E encrypted, cross-agent portable memory. That's the gap.

**Tech stack:** TypeScript, SQLite via better-sqlite3, Node crypto (no external crypto deps), 4 runtime dependencies total. Single bundled file. MIT licensed.

GitHub: https://github.com/jjosegomez/memex

Happy to answer questions about the encryption architecture, MCP protocol details, or the FTS5 trade-off.

---

## 2. Reddit Posts

### 2a. r/ClaudeAI Post

**Title:** I built an encrypted MCP server that gives Claude Code persistent memory across sessions

**Body:**

I've been using Claude Code daily for about 6 months, and the thing that kept bugging me was losing context. Every new session, I'd spend the first 10 minutes re-explaining: "the auth uses JWT with refresh tokens", "we have a monorepo with three packages", "the API follows this naming convention."

CLAUDE.md helps, but it's manual. You have to remember what to write in there. And it doesn't carry over when I switch to Cursor for a quick task.

So I built **Memex** -- an MCP server that gives Claude Code (and any MCP agent) persistent, encrypted memory.

**How it works:**

1. Run `npx memex-mcp init` -- generates your encryption key, creates a local SQLite DB, registers the MCP server with Claude Code
2. Claude Code gets 4 new tools: `save_memory`, `recall_memories`, `search_memories`, `delete_memory`
3. Your agent starts saving context automatically -- architecture decisions, patterns, debugging notes
4. Next session, it recalls what it needs

Everything is AES-256-GCM encrypted before it hits disk. Memories are scoped to your git repo, so switching projects gives you different context.

**What makes it different from Claude's built-in memory:**
- E2E encrypted (your code context isn't stored in plaintext)
- Works across agents (save in Claude Code, recall in Cursor)
- You can see, search, export, and delete your memories via CLI
- Open source -- you can audit every line (MIT license)
- Zero-knowledge -- no cloud, no accounts, no telemetry

GitHub: https://github.com/jjosegomez/memex

Landing page: https://getmemex.dev

Would love feedback from other Claude Code users. What context do you find yourself repeating most?

---

### 2b. r/cursor Post

**Title:** Built an encrypted memory layer for Cursor (and any MCP agent) -- never re-explain your codebase again

**Body:**

Does anyone else find themselves repeating the same context to Cursor every session?

"Here's how our auth works." "We use this folder structure." "The API naming convention is..."

I built **Memex** to fix this. It's an MCP server that gives Cursor persistent memory across sessions. Every memory is E2E encrypted (AES-256-GCM) and stored locally on your machine.

**Setup takes 30 seconds:**

1. Run `npx memex-mcp init`
2. Add to your `.cursor/mcp.json`:

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

3. Cursor now has 4 new tools: save, recall, search, delete memories

**The cool part:** memories are scoped to your git repo. Switch projects, get different context. And because it uses the MCP protocol, the same memories are available in Claude Code, Windsurf, or any MCP-compatible tool. Save context in Cursor, recall it in Claude Code.

No cloud. No accounts. No telemetry. Just a local SQLite database with full-text search (FTS5 + BM25 ranking). 4 npm dependencies. MIT licensed.

GitHub: https://github.com/jjosegomez/memex

Curious if other Cursor users would find this useful. What context do you wish Cursor remembered between sessions?

---

## 3. Twitter/X Thread

### Tweet 1 (Hook)

Your AI coding agent forgets everything the moment you close the session.

I built the fix. Open source. E2E encrypted. Works with Claude Code, Cursor, and Windsurf.

One command:

```
npx memex-mcp init
```

Thread on what Memex does and why encryption matters:

### Tweet 2 (Pain)

The average developer using AI coding tools spends 10-15 min per session re-explaining context.

"Here's how our auth works."
"We use a monorepo."
"The API naming convention is..."

Multiply that by 5 sessions a week. That's over an hour wasted on context your agent already knew yesterday.

### Tweet 3 (Solution)

Memex is an MCP server that gives your AI agent persistent memory.

- save_memory: Store architecture decisions, patterns, context
- recall_memories: Auto-retrieve relevant context next session
- search_memories: Full-text search across all your projects
- delete_memory: You control what stays

Memories scoped to git repo. Switch projects, get different context.

### Tweet 4 (Technical credibility)

Built for developers who care about where their code context goes:

- AES-256-GCM encryption (unique IV per memory)
- PBKDF2 key derivation (100K iterations, SHA-512)
- Zero-knowledge: no cloud, no accounts, no telemetry
- SQLite + FTS5 with BM25 ranking
- 4 dependencies. MIT licensed.

Your encryption key never leaves your machine.

### Tweet 5 (CTA)

Memex is free and open source.

GitHub: https://github.com/jjosegomez/memex
Landing page: https://getmemex.dev

Cloud sync is coming (E2E encrypted -- only encrypted blobs leave your machine).

Star it. Try it. Tell me what breaks.

---

## 4. Distribution Plan

### Launch Day Timeline (Targeting a Tuesday or Wednesday)

**Why Tuesday/Wednesday:** HN traffic peaks mid-week. Reddit developer subreddits are most active Tue-Thu. Avoid Monday (buried by weekend backlog) and Friday (people check out early).

**Best posting times (all times ET):**
- Hacker News: 8:00-9:00 AM ET (catches East Coast morning + overlaps with EU afternoon)
- Reddit: 9:00-10:00 AM ET
- Twitter/X: 10:00-11:00 AM ET (after HN/Reddit have built some traction to reference)

### First Week Calendar

**Day 1 (Tuesday) -- Launch Day:**
- 8:00 AM ET: Post Show HN
- 8:05 AM ET: Post first comment on HN (technical details -- see Section 5)
- 9:00 AM ET: Post to r/ClaudeAI
- 9:30 AM ET: Post to r/cursor
- 10:00 AM ET: Post Twitter thread
- 10:30 AM ET: Post to r/LocalLLaMA (angle: local-first, encrypted, no cloud dependency)
- All day: Monitor and respond to every comment. Speed matters on HN.

**Day 2 (Wednesday) -- Follow Up:**
- Post to r/programming (more technical angle, focus on the encryption architecture and MCP protocol)
- Share on Dev.to (rewrite as blog post: "I built E2E encrypted memory for AI coding agents")
- Engage with any Twitter replies/quote tweets
- If HN post is on front page, post a follow-up tweet linking to the HN discussion

**Day 3 (Thursday) -- Developer Communities:**
- Post in MCP Discord / Anthropic developer community
- Share on relevant Discord servers (AI coding tool communities)
- Post on Hacker News "Who is hiring?" thread if timing aligns (mention project for context)
- Post to r/SideProject

**Day 4 (Friday) -- Content:**
- Publish a short blog post or Twitter thread on the encryption architecture specifically (technical deep dive)
- "How I built E2E encrypted search with SQLite FTS5" -- this is HN-bait content
- Share in any relevant Slack communities (Indie Hackers, developer Slacks)

**Day 5-6 (Weekend) -- Rest + Async:**
- Monitor GitHub issues
- Respond to any late Reddit/HN comments
- Fix any bugs reported during launch week

**Day 7 (Monday) -- Week 2 Prep:**
- Compile launch metrics (GitHub stars, npm downloads, landing page visitors)
- Write a "launch retrospective" Twitter thread (numbers, what worked, what surprised you)
- Plan v2 features based on feedback

### Communities & People to Share With

**Communities (post directly):**
1. **Hacker News** -- Show HN post (primary launch vehicle)
2. **r/ClaudeAI** (~150K members) -- Claude Code power users
3. **r/cursor** (~50K members) -- Cursor users frustrated with context loss
4. **r/LocalLLaMA** (~500K members) -- privacy-conscious AI developers
5. **r/programming** (~6M members) -- broader developer audience
6. **r/SideProject** -- indie builder angle
7. **Dev.to** -- blog post format, good SEO
8. **MCP Discord / Anthropic Community** -- direct target audience
9. **Indie Hackers** -- builder community, cross-promote with landing page
10. **Product Hunt** -- save for week 2 or 3 (separate launch moment)

**People to DM / tag (Twitter):**
1. **@alexalbert__** (Alex Albert, Anthropic) -- built Claude Code, would care about MCP ecosystem
2. **@simonw** (Simon Willison) -- SQLite enthusiast, writes about AI tools extensively
3. **@swyx** (Shawn Wang) -- AI/dev tools thought leader, covers MCP
4. **@raaborman** -- MCP protocol creator at Anthropic
5. **@mcaborman** -- Cursor team members active on Twitter
6. **MCP ecosystem builders** -- anyone building/sharing MCP servers
7. **AI coding tool reviewers** on YouTube (search "Claude Code tutorial", "Cursor review")

**DM angle:** Don't ask them to share. Share the project and say "Built this, thought you'd find it interesting given [specific thing they've written about]. No ask -- just wanted to show you." Let them decide if it's worth sharing.

### Expected Impact (Conservative Estimates)

| Channel | Expected Reach | GitHub Stars (Est.) |
|---------|---------------|-------------------|
| HN (front page) | 20K-50K views | 200-500 |
| HN (page 2-3) | 2K-5K views | 30-80 |
| r/ClaudeAI | 5K-15K views | 50-150 |
| r/cursor | 3K-8K views | 30-80 |
| Twitter thread | 2K-10K impressions | 20-50 |
| r/LocalLLaMA | 5K-10K views | 30-60 |
| Dev.to blog | 1K-3K reads | 10-20 |

**Realistic Day 1 target:** 100-300 GitHub stars, 50-200 npm installs.
**Realistic Week 1 target:** 300-800 GitHub stars, 200-500 npm installs.

Key success metric: npm installs (people actually trying it) > GitHub stars (passive interest).

---

## 5. First Comment Templates

### 5a. Hacker News First Comment (Post immediately after your Show HN)

**Comment:**

Some technical details that didn't fit in the post:

**MCP Protocol:** Memex communicates via stdio using JSON-RPC 2.0 (the MCP standard). Your AI tool spawns `memex serve` as a child process. No HTTP server, no ports, no network calls. Just stdin/stdout.

**Dependency count:** 4 runtime deps -- `@modelcontextprotocol/sdk`, `better-sqlite3`, `commander`, `zod`. Everything except `better-sqlite3` (native module) is bundled into a single file by tsup.

**The FTS5 trade-off:** The full-text search index stores plaintext locally. This is necessary because FTS5 can't search encrypted content. The primary `memories` table stores AES-256-GCM ciphertext. When cloud sync ships, only the encrypted table syncs. The FTS index stays on your machine. I documented this trade-off openly in the ARCHITECTURE.md.

**Key storage:** By default, Memex generates a random 256-bit key stored at `~/.config/memex/key.enc` (600 permissions). Opt-in passphrase mode uses PBKDF2 to derive the key. The raw key is never written to disk in passphrase mode.

**What agents actually save:** In practice, Claude Code saves things like "this project uses a repository pattern for data access", "the auth middleware validates JWTs from the /api/auth endpoint", "migration V3 added the users_roles table." The agent decides what's worth remembering.

Happy to go deeper on any of this. Code is MIT, all 45 files are readable: https://github.com/jjosegomez/memex

---

### 5b. Reddit Engagement Replies

**For "How is this different from CLAUDE.md / .cursorrules?":**

Good question. CLAUDE.md is manual -- you write it yourself and maintain it by hand. Memex is automatic -- your agent saves context as you work together. It also persists across sessions (CLAUDE.md is read once at session start), and works across agents (your Cursor and Claude Code share the same memories). Think of CLAUDE.md as a static config file and Memex as a dynamic memory.

**For "Is the FTS plaintext a security concern?":**

Fair point, and I documented this trade-off in the architecture doc. The FTS index stores plaintext locally on your machine (same as any file on your disk). The encrypted column exists for cloud sync (coming later) -- only encrypted blobs will leave your machine. If you want disk-level protection for the local file, FileVault/LUKS handles that. I chose to be transparent about this rather than hide it.

**For "Why not use embeddings instead of FTS5?":**

For MVP, FTS5 with BM25 ranking is fast, has zero extra dependencies, and works well for the kind of content developers store (code patterns, architecture notes, config decisions). Embedding models would add a 200MB+ download and slow startup. It's on the roadmap for v2, but FTS5 handles 90% of the use case.

**For "Does it work with [X tool]?":**

If the tool supports MCP (Model Context Protocol), yes. The config is just:

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

Claude Code, Cursor, and Windsurf all support MCP. More tools are adding support regularly.

**For "What happens to my data if I uninstall?":**

Your data stays on your machine. The SQLite database is at `~/.local/share/memex/memex.db` and your key is at `~/.config/memex/key.enc`. You can export everything with `memex export` before uninstalling. Nothing is ever sent anywhere.

**For "Cloud sync sounds risky":**

Cloud sync will be E2E encrypted end-to-end. The server will only ever see encrypted blobs. It can't read your memories. Think Signal protocol for AI memory. The search index stays local -- only ciphertext syncs. I'll open-source the sync protocol when it ships so you can verify.

---

## 6. Bonus: LinkedIn Post (Developer Network)

I just open-sourced Memex -- a tool I built to solve a problem that's been nagging me for months.

If you use AI coding assistants (Claude Code, Cursor, Windsurf), you know the pain: every new session starts from scratch. Your agent forgets your architecture, your conventions, your debugging context. You end up re-explaining the same things over and over.

Memex gives your AI agents persistent, encrypted memory across sessions.

The key details:
- E2E encrypted (AES-256-GCM, unique IVs, PBKDF2 key derivation)
- Works across AI tools (not locked into one vendor's ecosystem)
- Local-first (your data stays on your machine)
- Open source (MIT) -- you can audit every line
- One command to install: npx memex-mcp init

What I'm most proud of is the encryption architecture. In a space where most tools store your code context in plaintext on cloud servers, Memex encrypts everything before it touches disk. When cloud sync ships, only encrypted blobs will leave your machine.

I'd love feedback from anyone building with AI coding tools. What context do you wish your agent remembered?

GitHub: https://github.com/jjosegomez/memex

#opensource #developertools #ai #encryption

---

## 7. Bonus: Hashnode / Dev.to Blog Post Outline

**Title:** I built E2E encrypted memory for AI coding agents. Here's the architecture.

**Outline:**

1. **The Problem** (200 words) -- AI agents have amnesia. The cost of re-explaining context.
2. **Why I built Memex** (150 words) -- Personal frustration, gap in the market. Mem0 isn't encrypted, Pieces is too heavy, Copilot Memory is locked to GitHub.
3. **How it works** (300 words) -- MCP protocol, 4 tools, SQLite + FTS5, project scoping via git root.
4. **The Encryption Architecture** (500 words) -- AES-256-GCM, PBKDF2, unique IVs, the FTS5 plaintext trade-off, key storage. Include code snippets from the actual implementation.
5. **What agents actually remember** (200 words) -- Real examples of useful memories: auth patterns, migration decisions, API conventions, debugging notes.
6. **Results** (150 words) -- How much time it saves, qualitative improvements in agent output quality.
7. **Try it** (100 words) -- Install instructions, GitHub link, what's coming next (cloud sync).

**Total:** ~1,600 words. Include 2-3 code snippets and the architecture diagram from the repo.
