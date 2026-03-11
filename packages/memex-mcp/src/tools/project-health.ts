import type Database from 'better-sqlite3';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { decryptContent } from '../crypto/encryption.js';
import { listSessions, getEventCount } from '../db/session-queries.js';
import { getMemoryCount } from '../db/queries.js';

interface ProjectHealth {
  project: string;
  short_name: string;
  momentum: 'hot' | 'warm' | 'cold' | 'stale';
  state: string;
  metrics: {
    memory_count: number;
    session_count: number;
    recent_session_count: number;
    last_session_at: string | null;
    last_commit_at: string | null;
    last_commit_msg: string | null;
    uncommitted_changes: number;
    open_prs: number;
  };
  recent_sessions: Array<{
    id: string;
    title: string | null;
    started_at: string;
    event_count: number;
    summary: string | null;
  }>;
  handoff: string | null;
}

interface HealthReport {
  generated_at: string;
  projects: ProjectHealth[];
  summary: string;
}

/**
 * Assess health for a single project directory.
 */
function assessProject(
  db: Database.Database,
  key: Buffer,
  projectPath: string,
): ProjectHealth {
  const shortName = projectPath.split('/').slice(-1)[0] || projectPath;

  // Memory count
  const memoryCount = getMemoryCount(db, projectPath);

  // Session data
  const allSessions = listSessions(db, {
    project: projectPath,
    limit: 100,
    offset: 0,
    status: 'all',
  });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentSessions = allSessions.filter((s) => s.started_at > weekAgo);
  const lastSession = allSessions[0] || null;

  // Git info
  let lastCommitAt: string | null = null;
  let lastCommitMsg: string | null = null;
  let uncommittedChanges = 0;
  let openPrs = 0;

  if (fs.existsSync(path.join(projectPath, '.git'))) {
    try {
      const log = execSync('git log -1 --format="%aI|||%s"', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      const [date, msg] = log.split('|||');
      lastCommitAt = date || null;
      lastCommitMsg = msg || null;
    } catch { /* not a git repo or no commits */ }

    try {
      const status = execSync('git status -s', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      uncommittedChanges = status ? status.split('\n').length : 0;
    } catch { /* ignore */ }

    try {
      const prs = execSync('gh pr list --state open --json number 2>/dev/null', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      openPrs = prs ? JSON.parse(prs).length : 0;
    } catch { /* gh not available or not a gh repo */ }
  }

  // Determine momentum
  const lastActivity = lastSession?.started_at || lastCommitAt;
  let momentum: ProjectHealth['momentum'] = 'stale';
  if (lastActivity) {
    const daysSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 1) momentum = 'hot';
    else if (daysSince < 7) momentum = 'warm';
    else if (daysSince < 30) momentum = 'cold';
  }

  // Determine state
  let state = 'unknown';
  if (uncommittedChanges > 0) state = 'in-progress';
  else if (openPrs > 0) state = 'review';
  else if (momentum === 'hot') state = 'active';
  else if (momentum === 'warm') state = 'maintenance';
  else state = 'idle';

  // Recent sessions with decrypted summaries
  const recentWithSummary = allSessions.slice(0, 3).map((s) => {
    let summary: string | null = null;
    if (s.summary_enc && s.summary_iv && s.summary_auth_tag) {
      try {
        summary = decryptContent(
          s.summary_enc as unknown as Buffer,
          s.summary_iv as unknown as Buffer,
          s.summary_auth_tag as unknown as Buffer,
          key,
        );
      } catch { /* skip */ }
    }
    return {
      id: s.id,
      title: s.title,
      started_at: s.started_at,
      event_count: s.ended_at ? s.event_count : getEventCount(db, s.id),
      summary,
    };
  });

  // Find most recent handoff note
  let handoff: string | null = null;
  try {
    const handoffRows = db.prepare(
      `SELECT m.content_enc, m.iv, m.auth_tag
       FROM memories m, json_each(m.tags) je
       WHERE m.project = ? AND m.deleted_at IS NULL AND je.value = 'handoff'
       ORDER BY m.created_at DESC LIMIT 1`
    ).all(projectPath) as Array<{ content_enc: Buffer; iv: Buffer; auth_tag: Buffer }>;

    if (handoffRows.length > 0) {
      const row = handoffRows[0]!;
      handoff = decryptContent(row.content_enc, row.iv, row.auth_tag, key);
    }
  } catch { /* no handoff */ }

  return {
    project: projectPath,
    short_name: shortName,
    momentum,
    state,
    metrics: {
      memory_count: memoryCount,
      session_count: allSessions.length,
      recent_session_count: recentSessions.length,
      last_session_at: lastSession?.started_at || null,
      last_commit_at: lastCommitAt,
      last_commit_msg: lastCommitMsg,
      uncommitted_changes: uncommittedChanges,
      open_prs: openPrs,
    },
    recent_sessions: recentWithSummary,
    handoff,
  };
}

/**
 * Generate a health report across all known projects.
 */
export function handleProjectHealth(
  db: Database.Database,
  key: Buffer,
  params: { projects?: string[] },
): HealthReport {
  // Discover projects from Memex data
  const memoryProjects = db.prepare(
    `SELECT DISTINCT project FROM memories WHERE deleted_at IS NULL`
  ).all() as Array<{ project: string }>;

  const sessionProjects = db.prepare(
    `SELECT DISTINCT project FROM sessions`
  ).all() as Array<{ project: string }>;

  const allProjects = new Set<string>();
  for (const p of memoryProjects) allProjects.add(p.project);
  for (const p of sessionProjects) allProjects.add(p.project);

  // If specific projects requested, filter
  const projectList = params.projects && params.projects.length > 0
    ? params.projects
    : Array.from(allProjects);

  const projects = projectList.map((p) => assessProject(db, key, p));

  // Sort: hot first, then warm, cold, stale
  const momentumOrder = { hot: 0, warm: 1, cold: 2, stale: 3 };
  projects.sort((a, b) => momentumOrder[a.momentum] - momentumOrder[b.momentum]);

  // Generate summary
  const hot = projects.filter((p) => p.momentum === 'hot').length;
  const warm = projects.filter((p) => p.momentum === 'warm').length;
  const blocked = projects.filter((p) => p.metrics.uncommitted_changes > 0).length;
  const withPRs = projects.filter((p) => p.metrics.open_prs > 0).length;

  const summary = `${projects.length} projects tracked: ${hot} hot, ${warm} warm. ${blocked} with uncommitted changes, ${withPRs} with open PRs.`;

  return {
    generated_at: new Date().toISOString(),
    projects,
    summary,
  };
}
