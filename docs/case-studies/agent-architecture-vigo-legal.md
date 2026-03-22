# Agent Architecture Observations — ViGo Legal Case Study (2026-03-22)

## Hub-and-Spoke vs Mesh Architecture

**Current Claude Code agent model**: Hub-and-spoke
- Parent session (hub) launches child agents (spokes)
- Each agent is an isolated subprocess — no inter-agent communication
- No shared memory, no message bus, no event system
- Context sharing only happens through files on disk
- Coordination layer is the parent session, not the agents themselves

**What works:**
- Parallel execution of independent tasks (e.g., 5 test-writing agents touching different files)
- Background agents for long-running research while parent continues interactive work
- Each agent gets full codebase access via tools

**What doesn't work:**
- Agents can't talk to each other mid-execution
- No event subscription ("notify me when test file created")
- No negotiation for shared resources (merge conflicts if two agents edit same file)
- No ability to build on each other's output in real-time
- Sequential dependency requires manual chaining by parent

**The gap:** "Parallel execution" ≠ "collaborative agents." True collaboration would require:
- Agent bus / message passing between running agents
- Shared context store (beyond just filesystem)
- Event-driven triggers (agent A completes → agent B starts with A's output)
- Conflict resolution for shared file access
- Conversation protocol between specialized agents (e.g., lawyer agent reviews what engineer agent wrote)

**Practical implication for Memex:** When designing multi-agent orchestration, the architecture choice between hub-spoke and mesh fundamentally changes what's possible. Hub-spoke is simpler but limits emergent collaboration. Mesh enables richer interaction but requires solving coordination, consistency, and deadlock problems.

## ViGo Legal Testing Session — Concrete Example

- Launched PO-orchestrated audit: 1 agent read 70+ files across the codebase, produced TEST_AUDIT.md
- Then launched 5 parallel agents for independent P0 test-writing tasks
- Scoped each agent to non-overlapping files to avoid conflicts
- Parent (me) acts as coordinator — reviews outputs, resolves any issues
- This works because the tasks are embarrassingly parallel, not because the agents are smart about collaboration
