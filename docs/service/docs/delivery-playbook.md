# Delivery Playbook

> Internal document. How to execute the service for a client, step by step.

---

## Pre-Engagement

### Before Discovery
- [ ] Client confirms point of contact
- [ ] Client grants GitHub read access to 2-3 representative repos
- [ ] Schedule discovery session (1-2 hours)
- [ ] Send pre-read: brief overview of what we'll cover (set expectations)

---

## Phase 1: Discovery (Day 1)

### Run the Session
Use `discovery-questionnaire.md` as the guide. Cover all sections:
1. Team & Roles
2. Client Portfolio (for agencies)
3. Tech Stack(s)
4. Current Workflow
5. Pain Points
6. Knowledge & Standards
7. Goals & Expectations

### Key Things to Observe
- Which questions do they struggle to answer? (= undocumented knowledge)
- Do different people give different answers? (= inconsistency)
- What do they get excited about? (= where to show value first)
- What tools are they already using? (= build on top, don't replace)

### After Discovery (within 48 hours)
- [ ] Write findings summary
- [ ] Identify the 3 projects for initial setup
- [ ] Draft the recommended setup plan
- [ ] Customize the proposal with specific pricing
- [ ] Send to client for review

---

## Phase 2: Setup (Weeks 1-2)

### Week 1: Foundation

#### Day 1-2: Agency-Wide Configuration
- [ ] Create agency standards repo (or identify existing one)
- [ ] Write agency-wide CLAUDE.md:
  - Shared coding standards across all projects
  - PR process and review standards
  - Security baseline and common constraints
  - Testing approach and requirements
- [ ] Write agency-wide PATTERNS.md:
  - Common patterns used across projects
  - Known anti-patterns to avoid
  - Cross-project integration patterns
- [ ] Create workflow commands (agency-level):
  - `/review` — code review against project standards
  - `/pr` — PR creation with agency template
  - `/test` — test generation following agency patterns
  - `/onboard` — project onboarding helper

#### Day 3-5: Per-Project Setup (Project 1 & 2)
For each project:
- [ ] Read the codebase (at least: entry points, key modules, config files, tests)
- [ ] Identify: stack, key libraries, deployment target, CI/CD
- [ ] Write project CLAUDE.md:
  - Stack-specific conventions
  - File/folder structure rationale
  - Do's and don'ts specific to this codebase
  - Client-specific constraints (compliance, deployment, etc.)
- [ ] Write project CONTEXT.md:
  - Current architecture overview
  - Key decisions made (and why)
  - What's in progress / what's next
  - Known tech debt and gotchas
- [ ] Write project PATTERNS.md:
  - Project-specific patterns (auth, error handling, data access, etc.)
  - Integration gotchas with third-party services
  - Deployment notes
- [ ] Test: open a fresh Claude Code session in the project, ask it to do something. Does the output follow the standards? If not, adjust the knowledge files.

### Week 2: Polish + Dashboard + Training

#### Day 6-7: Per-Project Setup (Project 3) + Refinement
- [ ] Set up Project 3 (same process as above)
- [ ] Revisit Projects 1 & 2 — refine based on what you learned
- [ ] Create project onboarding template for future projects

#### Day 8-9: Knowledge Dashboard
- [ ] Deploy dashboard MVP (GitHub OAuth, project grid, markdown rendering, search, staleness)
- [ ] Connect to client's GitHub org
- [ ] Verify all knowledge files show up correctly
- [ ] Test search across projects

#### Day 10: Training
- [ ] Session 1: Developers (hands-on, 1 hour)
  - How to use Claude Code with the configured environment
  - How to use workflow commands
  - How to update knowledge files when they discover something new
  - How to use the dashboard
- [ ] Session 2: Leads/Managers (overview, 1 hour)
  - Dashboard walkthrough
  - How to set up new client projects using the template
  - How to maintain the knowledge base
  - How to onboard new developers

---

## Phase 3: Tuning (Weeks 3-6)

### Weekly Check-ins
- [ ] Which commands are developers using? Which are ignored?
- [ ] Are there recurring questions that indicate missing knowledge?
- [ ] Is AI output quality good? Collect examples of good and bad output.
- [ ] Are guardrails appropriate? Too strict for seniors? Too loose for juniors?

### Adjustments
- Replace unused commands with ones that match actual workflow
- Add knowledge entries for gaps revealed by bad AI output
- Recalibrate role-based configs based on real seniority levels
- Add any new gotchas or patterns discovered during the first month

---

## Phase 4: Ongoing Maintenance (Monthly)

### Monthly Routine
- [ ] Review all CONTEXT.md files — update stale ones
- [ ] Review dashboard health scores — address red/yellow items
- [ ] Check for new projects that need setup (up to 2/month in retainer)
- [ ] Update commands if workflow has changed
- [ ] Add new patterns discovered by the team

### Quarterly Review
- [ ] Full agent effectiveness report
- [ ] Recommendations for optimization
- [ ] Review pricing if scope has changed significantly

### As-Needed
- [ ] New developer onboarding (set up their environment)
- [ ] Developer offboarding (knowledge capture session)
- [ ] New client project setup (use template, customize)

---

## Templates Checklist

Every client project should have these files. Use templates from `templates/` as starting points.

| File | Purpose | Required |
|---|---|---|
| CLAUDE.md | Coding standards, conventions, AI instructions | Yes |
| CONTEXT.md | Architecture, decisions, current state | Yes |
| PATTERNS.md | Reusable patterns, gotchas, integration notes | Yes |
| decisions/ | Architecture Decision Records (if complex) | Optional |
