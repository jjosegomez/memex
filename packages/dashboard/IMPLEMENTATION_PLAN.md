# Memex Agency Pivot — Implementation Plan

> Generated 2026-03-21. Execute with parallel Claude Code agents.

## Technical Decisions (Final)

| # | Decision | Choice | Reasoning |
|---|---|---|---|
| 1 | Framework version | **Keep Next.js 16 + React 19 + Tailwind 4** | Dashboard is the product. Don't downgrade. Each workspace has its own deps. |
| 2 | Auth | **Auth.js v5 + GitHub OAuth + JWT sessions** | No database needed for auth. JWT holds GitHub access token for Octokit calls. |
| 3 | Auto-generate CLAUDE.md | **Anthropic SDK (claude-sonnet-4-20250514)** | Server action sends repo tree + README + package.json → generates CLAUDE.md → creates PR via Octokit. |
| 4 | Database | **None (JWT sessions, GitHub API + cache)** | Add SQLite sessions table only if needed in Phase 3. |
| 5 | Deployment | **Netlify** | Juan already uses it. Supports Next.js 16 via `@netlify/plugin-nextjs`. Monorepo base directory config. |
| 6 | Landing page | **Separate package** | Different deployment target (getmemex.dev vs app.getmemex.dev). Rewrite in Phase 4. |

---

## Monorepo Merge Plan

### Step A: Delete old dashboard
```bash
rm -rf packages/dashboard/
```

### Step B: Copy knowledge-dashboard → packages/dashboard
```
knowledge-dashboard/src/               → packages/dashboard/src/
knowledge-dashboard/public/            → packages/dashboard/public/
knowledge-dashboard/package.json       → packages/dashboard/package.json
knowledge-dashboard/tsconfig.json      → packages/dashboard/tsconfig.json
knowledge-dashboard/next.config.*      → packages/dashboard/next.config.*
knowledge-dashboard/postcss.config.*   → packages/dashboard/postcss.config.*
knowledge-dashboard/eslint.config.*    → packages/dashboard/eslint.config.*
knowledge-dashboard/components.json    → packages/dashboard/components.json
knowledge-dashboard/brand/             → packages/dashboard/brand/
knowledge-dashboard/AGENTS.md          → packages/dashboard/AGENTS.md
knowledge-dashboard/.env.example       → packages/dashboard/.env.example
```
Do NOT copy: node_modules/, package-lock.json, .next/, tsconfig.tsbuildinfo

### Step C: Copy service docs
```
agent-setup-service/dashboard-spec.md          → docs/service/dashboard-spec.md
agent-setup-service/proposal-template.md       → docs/service/proposal-template.md
agent-setup-service/discovery-questionnaire.md → docs/service/discovery-questionnaire.md
agent-setup-service/docs/                      → docs/service/docs/
agent-setup-service/clients/                   → docs/service/clients/
agent-setup-service/templates/                 → docs/service/templates/
```

### Step D: Run npm install from root, verify build

---

## Phase 1: "The Demo" (~4-6 hours)

**Goal:** Dashboard running in monorepo, deployed to public URL, showing Juan's GitHub org.

| # | Step | Size | Parallel? |
|---|------|------|-----------|
| 1.1 | Delete old `packages/dashboard` | S | Yes (with 1.2) |
| 1.2 | Copy service docs to `docs/service/` | S | Yes (with 1.1) |
| 1.3 | Copy knowledge-dashboard into `packages/dashboard/` | S | After 1.1 |
| 1.4 | Workspace integration: `npm install`, verify `npm run dev:dashboard` | M | After 1.3 |
| 1.5 | Create `.env.local` with GitHub PAT + org, test locally | S | After 1.4 |
| 1.6 | Create `netlify.toml`, configure Netlify project + env vars | M | After 1.5 |
| 1.7 | Deploy + verify public URL works | S | After 1.6 |
| 1.8 | Update ARCHITECTURE.md, CLAUDE.md, README | M | Parallel with 1.4-1.7 |

**Done when:** Public URL shows Juan's GitHub repos with health scores. `npm install && npm run build` passes from root.

---

## Phase 2: "The Onboarding" (~12-18 hours)

**Goal:** GitHub OAuth, Connect Org, auto-generate CLAUDE.md, client grouping.

| # | Step | Size | Parallel? |
|---|------|------|-----------|
| 2.1 | Install Auth.js v5, create `src/auth.ts` with GitHub provider + JWT | M | — |
| 2.2 | Auth middleware: protect routes, redirect to login | M | After 2.1 |
| 2.3 | Login page (`/login`) with "Sign in with GitHub" | S | Parallel with 2.2 |
| 2.4 | Refactor github-scanner to use session token (not env var) | M | After 2.2 |
| 2.5 | "Connect Your Org" flow (`/onboard`) — select org, store in JWT | M | After 2.4 |
| 2.6 | Auto-generate CLAUDE.md server action (Anthropic SDK) | L | Parallel with 2.5 |
| 2.7 | Create PR from generated CLAUDE.md (Octokit branch + commit + PR) | M | After 2.6 |
| 2.8 | Client grouping UI (group repos by prefix, collapsible headers) | M | Parallel with 2.6 |
| 2.9 | Deploy + test full flow | S | After 2.7, 2.8 |

**Parallel streams:**
- Stream A: 2.1 → 2.2 → 2.4 (auth foundation, sequential)
- Stream B: 2.3 (login page, parallel with 2.2)
- Stream C: 2.5 + 2.8 (org flow + grouping, parallel, after 2.4)
- Stream D: 2.6 → 2.7 (CLAUDE.md gen, parallel with Stream C, after 2.4)

**Done when:** Login → select org → see repos grouped by client → generate CLAUDE.md → PR created. Shareable URL for Henry demo.

---

## Phase 3: "The Adoption" (~16-24 hours)

**Goal:** Inline editing, My Projects, onboarding view, health trends.

| # | Step | Size | Parallel? |
|---|------|------|-----------|
| 3.1 | Inline editing → PR creation (markdown editor + Octokit PR) | L | All parallel |
| 3.2 | "My Projects" view (`/my-projects`) | M | All parallel |
| 3.3 | Project onboarding page (`/projects/[name]/onboard`) | M | All parallel |
| 3.4 | Health dashboard (`/health`) with trends | M | All parallel |
| 3.5 | Memex MCP memories in dashboard (stretch) | L | All parallel |

**Done when:** Full adoption loop works — team can edit knowledge, see personal views, onboard to projects, track health.

---

## Phase 4: Landing Page Rewrite (~6-10 hours)

| # | Step | Size |
|---|------|------|
| 4.1 | Upgrade landing to Next.js 16 + Tailwind 4, copy design tokens | M |
| 4.2 | Rewrite all copy for agency positioning | L |
| 4.3 | Add "See Dashboard Demo" + "Book a Call" CTAs | S |
| 4.4 | Deploy to getmemex.dev | S |

**Done when:** getmemex.dev shows agency positioning with links to dashboard demo.

---

## Risk Flags

1. **Next.js 16 + Auth.js v5 compat** — read `node_modules/next/dist/docs/` before writing auth code
2. **GitHub API rate limits** — 5-min cache exists, but fresh deploys hit hard. Add persistent cache if needed.
3. **npm workspace hoisting** — React 19 (dashboard) vs React 18 (landing) may conflict. Test early.
4. **Netlify monorepo build** — test with `netlify build` CLI before pushing
5. **`data-source.ts` refactor** — changing from env var to per-request token touches every server component

---

## Total Effort Estimate

| Phase | Hours | Priority | Deadline |
|---|---|---|---|
| Phase 1 | 4-6h | NOW | This weekend |
| Phase 2 | 12-18h | Before Henry meeting | Next week |
| Phase 3 | 16-24h | First month with Digital Bank | April |
| Phase 4 | 6-10h | After dashboard is live | April |
| **Total** | **38-58h** | | |
