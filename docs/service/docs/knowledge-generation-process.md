# Knowledge Generation Process

> Internal playbook. How to generate knowledge files for a client's repos.
> Learned by dogfooding on Juan's own repos (March 2026).

---

## The Process

### Step 1: Scan & Inventory

Before writing anything, scan all repos and categorize:

| Category | Action |
|---|---|
| **Active + revenue** | Full knowledge files (CLAUDE.md + CONTEXT.md + PATTERNS.md) |
| **Active + building** | CLAUDE.md + CONTEXT.md minimum |
| **Paused / exploratory** | CLAUDE.md only (if anything) |
| **Archived / dead** | Skip entirely |

**Tools:** Run the Knowledge Dashboard to get the bird's eye view. Check git log recency to determine active vs. paused.

### Step 2: Auto-Generate Drafts

For each repo that needs knowledge files, scan these sources:

| Source | What it tells you |
|---|---|
| `package.json` / `requirements.txt` / `Cargo.toml` | Stack, dependencies, scripts |
| File/folder structure | Architecture pattern, organization |
| `README.md` | Original intent, setup instructions |
| `git log --oneline -20` | Recent activity, who's working on what |
| Config files (tsconfig, next.config, docker-compose, .env.example) | Deployment, environment, constraints |
| 2-3 key source files (entry points, routes, models) | Architecture, patterns, coding style |
| Existing docs/ folder | Any documentation already written |

**Output per repo:**
- Draft CLAUDE.md (or improvements to existing)
- Draft CONTEXT.md
- Draft PATTERNS.md (if enough gotchas/patterns found)

### Step 3: Human Review

The draft is 80% — the developer/lead reviews and adds:
- Business context the code doesn't reveal
- Why decisions were made (not just what)
- Known gotchas that aren't in code comments
- Client constraints (compliance, deployment)
- What's planned next

**This step is critical.** The auto-scan captures structure and conventions. Only humans know the WHY.

### Step 4: Validate

Open a fresh Claude Code session in the repo. Ask it to:
1. Explain the architecture → does it match reality?
2. Write a small feature → does it follow conventions?
3. Review existing code → does it catch real issues?

If the AI gets it wrong, the knowledge files need more context.

### Step 5: Iterate

After 1-2 weeks of use:
- What questions do developers still have to answer manually?
- What does the AI still get wrong?
- Add those to the knowledge files.

---

## What We Learned (Dogfooding on Juan's Repos)

### Starting state (22 repos):
- 11 had CLAUDE.md (50%)
- 3 had CONTEXT.md (14%)
- 1 shared PATTERNS.md
- 0 had all three

### Observations:
- **CLAUDE.md is the easiest to auto-generate** — stack, conventions, and structure are in the code
- **CONTEXT.md can be 80% auto-generated** — architecture, decisions, what's built, tech debt, and gotchas ARE in the code. Only "where I left off" and business context need human input.
- **PATTERNS.md accumulates over time** — you can't auto-generate it on day 1, it grows as gotchas are discovered
- **Scanning takes ~50-90 seconds per repo** — parallelizable across agents (tested: 4 repos scanned in parallel, all complete within ~90 seconds wall time)
- **CONTEXT.md generation from scan results takes ~2-3 minutes per repo** — mostly writing, minimal decisions
- **Review takes ~5-10 minutes per repo** — the human bottleneck
- **For a 10-repo client, expect ~2-3 hours total** (scan + draft + review)

### Quality of auto-generated CONTEXT.md:
- Architecture overview: excellent (directly from code)
- Key decisions: good (visible from tech choices, but missing "why" for business decisions)
- What's built: excellent (from file structure + git log)
- Tech debt: good (from code patterns and TODOs)
- Gotchas: good (from error handling patterns, config quirks, recent bug fixes)
- What's next: partial (from goals.md/roadmap if it exists, otherwise blank)
- Team/business context: needs human input (not in code)

### Key insight for client delivery:
> Don't try to generate perfect knowledge files on day 1. Generate 80% drafts,
> have the team review, then iterate over the first month. The tuning phase
> (Phase 3 in the proposal) is where the files become truly valuable.

---

## Metrics to Track

For each client, measure before/after:
1. **Coverage** — % of repos with knowledge files
2. **Completeness** — % of repos with all three files
3. **Freshness** — % of files updated in last 2 weeks
4. **AI output quality** — sample test: ask agent to write code, measure how many corrections needed

These become the quarterly optimization report data.
