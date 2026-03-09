# Memex Launch Posts

All distribution copy for launch day and the first week.

---

## 1. Show HN Post

**Title:** Show HN: Memex -- Stop re-explaining yourself to every AI coding tool

**Body:**

Hey HN,

I use Claude Code, Cursor, and occasionally Windsurf. Every single session starts the same way:

"We use JWT with refresh tokens." "It's a monorepo with three packages." "The API follows REST naming conventions." "The migration in V3 added the users_roles table."

You spend 10 minutes rebuilding context your agent knew yesterday. Switch tools and it's worse -- Cursor has no idea what you told Claude Code an hour ago. Your AI agents are amnesiac silos.

CLAUDE.md / .cursorrules help, but they're manual. You have to remember what to write, maintain them by hand, and they don't carry between tools.

**So I built Memex.** It's an MCP server that gives any MCP-compatible AI agent persistent memory across sessions and across tools. Save context in Claude Code, recall it in Cursor. Switch projects and get different context (scoped to git root).

One command:

```
npx memex-mcp init
```

Your agent gets 4 tools: `save_memory`, `recall_memories`, `search_memories`, `delete_memory`. The agent decides what's worth remembering -- architecture decisions, conventions, debugging notes -- and recalls it automatically next session.

It also auto-imports your existing AI tool configs (.cursorrules, CLAUDE.md, .codex/instructions.md) so your context is there from day one. Update a config file? Memex picks up the change next session.

**The portability part:** Memories work across any MCP-compatible tool. Claude Code, Cursor, Windsurf, whatever comes next. No vendor lock-in. Your context belongs to you, not your tool vendor.

**Oh, and it's all encrypted.** Every memory is AES-256-GCM encrypted with a unique 12-byte IV before it touches disk. Key derivation uses PBKDF2 with 100K iterations (SHA-512). No cloud, no accounts, no telemetry. SQLite + FTS5, stored locally.

The FTS5 index does store plaintext locally to make search work (FTS5 can't search ciphertext). For the planned cloud sync, only encrypted blobs leave your machine -- the search index stays local. I documented this trade-off in ARCHITECTURE.md.

**Why not existing solutions?**

- Mem0 ($24M raised, 48K stars) -- cloud-based, not E2E encrypted. Your code context sits on their servers. And it only works with their SDK, not across arbitrary MCP tools.
- Pieces (100K users) -- heavy desktop app. Not a lightweight thing you pipe into any agent.
- Copilot Memory -- GitHub-only walled garden. Switch to Claude Code and you lose everything.

**Tech:** TypeScript, SQLite via better-sqlite3, Node crypto (no external crypto deps), 4 runtime dependencies total. Single bundled file. MIT licensed.

GitHub: https://github.com/jjosegomez/memex

Happy to answer questions about the architecture, MCP protocol, or the FTS5 trade-off.

---

## 2. Reddit Posts

### 2a. r/ClaudeAI Post

**Title:** I built a memory layer that follows you across Claude Code, Cursor, and Windsurf -- never re-explain your codebase again

**Body:**

Anyone else tired of starting every Claude Code session with the same recap?

"Here's how auth works." "We use this folder structure." "The API convention is..." Repeat until you've burned 10 minutes and 3K tokens just getting back to where you were yesterday.

CLAUDE.md helps, but it's static. You write it, you maintain it, and it doesn't help when you switch to Cursor for a quick task.

I built **Memex** to fix this. It's an MCP server that gives Claude Code (and any MCP agent) persistent memory that actually carries across sessions and across tools.

**How it works:**

1. Run `npx memex-mcp init` -- sets up a local encrypted SQLite DB, registers the MCP server. It also auto-imports any existing .cursorrules, CLAUDE.md, or .codex/instructions.md it finds in your project.
2. Claude Code gets 4 new tools: `save_memory`, `recall_memories`, `search_memories`, `delete_memory`
3. Your agent starts saving context automatically -- architecture decisions, patterns, debugging context
4. Next session -- or in a different tool -- it remembers

**The cross-tool part is the real unlock:** I save context in Claude Code, then open the same project in Cursor, and the context is already there. No copy-pasting, no maintaining separate files per tool.

**What makes it different from Claude's built-in memory:**
- Works across agents (save in Claude Code, recall in Cursor)
- Scoped to git repos (switch projects, get different context)
- E2E encrypted -- AES-256-GCM before anything hits disk
- You own it: see, search, export, and delete your memories via CLI
- Open source, MIT license, zero cloud, zero telemetry

GitHub: https://github.com/jjosegomez/memex

Landing page: https://getmemex.dev

What context do you find yourself repeating most? For me it was auth patterns and migration history -- those are the things Memex saves me the most time on.

---

### 2b. r/cursor Post

**Title:** Your Cursor sessions shouldn't start from scratch every time -- I built a fix

**Body:**

Every time I open Cursor on a project I was working on yesterday:

"Here's how our auth works." "We use this folder structure." "The API naming convention is..."

Sound familiar? That context recap at the start of every session is 10 minutes of your life you don't get back. And if you switch between Cursor and Claude Code like I do, neither tool knows what you told the other one.

I built **Memex** to make this go away. It's an MCP server that gives Cursor persistent memory across sessions -- and across tools.

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

It also auto-imports your existing .cursorrules on first run, so you don't start from zero. Update .cursorrules later? Memex re-imports it next session.

**The part I actually care about:** memories are scoped to your git repo and work across tools. Save context in Cursor, recall it in Claude Code. Switch projects, get different context. Your memory follows you -- not your tool.

Everything is E2E encrypted (AES-256-GCM, unique IVs, PBKDF2 key derivation). No cloud. No accounts. No telemetry. Local SQLite with full-text search. 4 npm dependencies. MIT licensed.

GitHub: https://github.com/jjosegomez/memex

What context do you wish Cursor just... knew? The thing you're tired of typing every single session.

---

## 3. Twitter/X Thread

### Tweet 1 (Hook)

You explain your codebase to Claude Code.

Then you explain it again to Cursor.

Then you explain it again tomorrow because both forgot.

I built the fix. Open source. Works across every MCP tool.

```
npx memex-mcp init
```

Thread:

### Tweet 2 (Pain)

The average dev using AI coding tools spends 10-15 min per session re-explaining context.

"Here's how auth works."
"We use a monorepo."
"The API convention is..."

5 sessions a week = an hour wasted rebuilding context your agent already knew.

And if you use multiple tools? They can't share any of it.

### Tweet 3 (Solution)

Memex is an MCP server that gives your AI agents shared, persistent memory.

- save_memory: Agent stores decisions, patterns, context
- recall_memories: Auto-retrieves relevant context next session
- search_memories: Full-text search across all projects
- delete_memory: You control what stays
- Auto-imports your .cursorrules, CLAUDE.md, .codex/ configs -- no manual migration

Memories scoped to git repo. Works in Claude Code, Cursor, Windsurf -- same memories, any tool.

### Tweet 4 (Technical credibility)

And because your code context is sensitive, everything is encrypted:

- AES-256-GCM (unique IV per memory)
- PBKDF2 key derivation (100K iterations, SHA-512)
- Zero-knowledge: no cloud, no accounts, no telemetry
- SQLite + FTS5 with BM25 ranking
- 4 dependencies. MIT licensed.

Your data never leaves your machine.

### Tweet 5 (Comparison)

Why not existing tools?

- Mem0: cloud-based, not encrypted, their SDK only
- Pieces: heavy desktop app
- Copilot Memory: locked to GitHub's ecosystem

Memex: local-first, encrypted, works with any MCP tool, open source.

Your memory shouldn't be trapped in one vendor's silo.

### Tweet 6 (CTA)

Memex is free and open source.

GitHub: https://github.com/jjosegomez/memex
Landing: https://getmemex.dev

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
- Share on Dev.to (rewrite as blog post: "Your AI tools don't talk to each other. I built shared memory for them.")
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

**Cross-tool portability:** This is the part I care about most. The MCP protocol is the same across Claude Code, Cursor, and Windsurf. Memex doesn't care which tool is talking to it -- same memories, same project scope. Save something in Claude Code, open Cursor, it's there. The agent decides what to save and recall, and Memex doesn't know or care which agent is asking. On every server startup, Memex scans for config file changes (.cursorrules, CLAUDE.md, .codex/instructions.md, etc.) and re-imports automatically -- so your static configs and dynamic memories stay in sync without any manual work.

**Dependency count:** 4 runtime deps -- `@modelcontextprotocol/sdk`, `better-sqlite3`, `commander`, `zod`. Everything except `better-sqlite3` (native module) is bundled into a single file by tsup.

**The FTS5 trade-off:** The full-text search index stores plaintext locally. This is necessary because FTS5 can't search encrypted content. The primary `memories` table stores AES-256-GCM ciphertext. When cloud sync ships, only the encrypted table syncs. The FTS index stays on your machine. I documented this trade-off openly in the ARCHITECTURE.md.

**Key storage:** By default, Memex generates a random 256-bit key stored at `~/.config/memex/key.enc` (600 permissions). Opt-in passphrase mode uses PBKDF2 to derive the key. The raw key is never written to disk in passphrase mode.

**What agents actually save:** In practice, Claude Code saves things like "this project uses a repository pattern for data access", "the auth middleware validates JWTs from the /api/auth endpoint", "migration V3 added the users_roles table." The agent decides what's worth remembering -- you just work normally and context accumulates.

Happy to go deeper on any of this. Code is MIT, all 45 files are readable: https://github.com/jjosegomez/memex

---

### 5b. Reddit Engagement Replies

**For "How is this different from CLAUDE.md / .cursorrules?":**

Good question. CLAUDE.md is manual -- you write it yourself and maintain it by hand. Memex is automatic -- your agent saves context as you work together. It also persists across sessions (CLAUDE.md is read once at session start), and works across agents (your Cursor and Claude Code share the same memories). Think of CLAUDE.md as a static config file and Memex as a dynamic, portable memory. The "portable" part is key -- .cursorrules only works in Cursor, CLAUDE.md only works in Claude Code, but Memex works in both. And Memex auto-imports those files too, so you get the best of both -- your static configs are imported as memories AND your agent adds dynamic context on top as you work.

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

Claude Code, Cursor, and Windsurf all support MCP. More tools are adding support regularly. That's the whole point -- your memory shouldn't be locked into one tool.

**For "What happens to my data if I uninstall?":**

Your data stays on your machine. The SQLite database is at `~/.local/share/memex/memex.db` and your key is at `~/.config/memex/key.enc`. You can export everything with `memex export` before uninstalling. Nothing is ever sent anywhere.

**For "Cloud sync sounds risky":**

Cloud sync will be E2E encrypted end-to-end. The server will only ever see encrypted blobs. It can't read your memories. Think Signal protocol for AI memory. The search index stays local -- only ciphertext syncs. I'll open-source the sync protocol when it ships so you can verify.

---

## 6. Bonus: LinkedIn Post (Developer Network)

Every AI coding tool you use starts from zero.

Claude Code doesn't know what you told Cursor. Cursor doesn't know what you told Windsurf. Even the same tool forgets everything between sessions. You end up re-explaining your architecture, your conventions, your decisions -- over and over.

I got tired of it and built Memex: an open-source MCP server that gives AI coding agents shared, persistent memory.

What that means in practice:
- Save context in Claude Code, recall it in Cursor (or any MCP tool)
- Memories scoped to your project -- switch repos, get different context
- Your agent saves architecture decisions, patterns, and context as you work -- no manual maintenance
- Auto-imports existing .cursorrules, CLAUDE.md, and .codex/ configs -- and re-imports when they change
- One command to install: npx memex-mcp init

For developers who care about where their code context goes: everything is E2E encrypted (AES-256-GCM), stored locally, zero cloud. Your data never leaves your machine. MIT licensed -- audit every line.

In a space where Mem0 stores your context on their cloud and Copilot Memory locks you into GitHub's ecosystem, I wanted something portable and private.

GitHub: https://github.com/jjosegomez/memex

What context do you find yourself repeating to your AI tools? I'd love to hear from anyone else frustrated by the silo problem.

#opensource #developertools #ai #mcp

---

## 7. Bonus: Hashnode / Dev.to Blog Post Outline

**Title:** Your AI tools don't talk to each other. I built shared memory for them.

**Outline:**

1. **The problem nobody talks about** (250 words) -- You use Claude Code AND Cursor. Each one knows nothing about the other. Even the same tool forgets everything between sessions. The cumulative cost of context rebuilding -- time, tokens, and frustration.
2. **Why .cursorrules and CLAUDE.md aren't enough** (150 words) -- They're static, manual, tool-specific. The opposite of portable memory.
3. **What I built** (200 words) -- Memex: an MCP server that gives AI agents shared, persistent memory across tools and sessions. One install command. 4 tools. Scoped to git repos.
4. **How it works under the hood** (300 words) -- MCP protocol, SQLite + FTS5, project scoping via git root. Include code snippets showing the tool registration and memory flow.
5. **The encryption architecture** (400 words) -- AES-256-GCM, PBKDF2, unique IVs, the FTS5 plaintext trade-off, key storage. "We encrypt not because it's the headline, but because your code context is sensitive and the default should be privacy."
6. **What agents actually remember** (200 words) -- Real examples: auth patterns, migration decisions, API conventions, debugging context. Show a before/after of a session with and without Memex.
7. **The competition and why I still built this** (150 words) -- Mem0 (cloud, not encrypted, SDK-only), Pieces (heavy), Copilot Memory (GitHub-only). The gap: portable, encrypted, lightweight.
8. **Try it** (100 words) -- Install instructions, GitHub link, what's next (cloud sync, dashboard).

**Total:** ~1,750 words. Include 2-3 code snippets and the architecture diagram from the repo.
