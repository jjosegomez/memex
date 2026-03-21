# CONTEXT.md — Memex Dashboard

> Living document. Updated at session end, read at session start.

## Current Phase
Post-pivot. Dashboard merged into memex monorepo. Deployed to Netlify. Phase 1 complete, Phase 2 next.

## Last Session
- **Date:** 2026-03-21
- **What was done:**
  - Connected Stitch MCP "Primer Dashboard" design to knowledge-dashboard codebase
  - Synced full "Digital Architect" design tokens (dark monochrome + #22c55e green accent)
  - Swapped fonts: Geist → Inter + Space Grotesk
  - Built sidebar navigation, redesigned dashboard home + project detail pages
  - Built GitHub API scanner (Octokit) with 5-min cache, rate limiting, client grouping
  - Built data-source abstraction (local filesystem vs GitHub API mode)
  - Built Agency Standards page (/standards)
  - Generated complete Brand Identity Manual (v1 reference + v2 presentation)
  - Rebranded from "Primer" to "Memex", made org name configurable via env var
  - Redesigned landing page (packages/landing) with Memex brand
  - Generated Stitch screens for landing page (4 screens in "Memex Landing Page" project)
  - **PIVOTED**: Memex from personal dev memory → agency knowledge infrastructure
  - Product brief: onboarding flow, user stories, MVP scope, success metrics
  - Full implementation plan (4 phases, ~38-58 hours total)
  - Merged knowledge-dashboard into memex/packages/dashboard (replaced old memory viewer)
  - Copied agent-setup-service docs into docs/service/
  - Resolved React 19/18 workspace hoisting conflict via npm overrides
  - Deployed to Netlify: https://memex-dashboard.netlify.app
  - Updated ARCHITECTURE.md, CLAUDE.md, README.md for agency pivot

- **Where I left off:**
  - Phase 1 COMPLETE — dashboard deployed, monorepo merged, docs updated
  - Phase 2 NOT STARTED — GitHub OAuth, Connect Org, auto-generate CLAUDE.md, client grouping
  - Need to set GITHUB_TOKEN + GITHUB_ORG env vars on Netlify for live data
  - Both memex and knowledge-dashboard repos have uncommitted changes (74 + 18 files)

## Key Decisions
- **Full pivot to agencies** — Memex is knowledge infrastructure for software agencies, not personal dev memory
- **Dashboard IS the product** — MCP server is the engine underneath
- **Keep Next.js 16 + React 19** — don't downgrade for monorepo compat
- **Auth.js v5 + JWT** — no database for auth, GitHub token in JWT
- **Anthropic SDK for CLAUDE.md generation** — server action, creates PR
- **Netlify deployment** — dashboard at memex-dashboard.netlify.app
- **Landing stays separate package** — different deployment target

## What's Next
1. Commit all changes in both repos
2. Set GITHUB_TOKEN + GITHUB_ORG on Netlify, redeploy with live data
3. Phase 2: GitHub OAuth → Connect Org → Auto-generate CLAUDE.md → Client grouping
4. Schedule discovery session with Henry (Digital Bank)

## Architecture
```
memex/
├── packages/
│   ├── memex-mcp/        # MCP engine (npm: memex-mcp) — unchanged
│   ├── dashboard/         # Agency knowledge dashboard (Next.js 16, deployed to Netlify)
│   └── landing/           # getmemex.dev (Next.js 14, to be rewritten in Phase 4)
├── docs/
│   └── service/           # Proposals, specs, templates, playbook
└── package.json           # Workspace config with React version overrides
```

## Implementation Plan
See `packages/dashboard/IMPLEMENTATION_PLAN.md` for the full 4-phase plan.
