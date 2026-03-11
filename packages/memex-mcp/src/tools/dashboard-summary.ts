import type Database from 'better-sqlite3';
import { decryptContent } from '../crypto/encryption.js';
import { resolveProject } from '../lib/project.js';
import { listSessions, getEventCount } from '../db/session-queries.js';
import { getMemoryCount, getProjects } from '../db/queries.js';

interface DashboardSummary {
  project: string;
  overview: {
    total_memories: number;
    total_projects: number;
    total_sessions: number;
    active_sessions: number;
  };
  recent_sessions: Array<{
    id: string;
    title: string | null;
    agent_source: string;
    event_count: number;
    started_at: string;
    ended_at: string | null;
    summary: string | null;
  }>;
  top_projects: Array<{
    project: string;
    count: number;
  }>;
  markdown: string;
}

/**
 * Generate a dashboard summary for inline display by AI agents.
 * Returns both structured data and a pre-formatted markdown string.
 */
export function handleDashboardSummary(
  db: Database.Database,
  key: Buffer,
  params: { project?: string },
): DashboardSummary {
  const project = resolveProject(params.project);

  // Counts
  const totalMemories = getMemoryCount(db);
  const projectMemories = getMemoryCount(db, project);
  const projects = getProjects(db);

  const allSessions = listSessions(db, { limit: 1000, offset: 0, status: 'all' });
  const activeSessions = allSessions.filter((s) => !s.ended_at);
  const projectSessions = allSessions.filter((s) => s.project === project);

  // Recent sessions for this project
  const recentSessions = listSessions(db, {
    project,
    limit: 5,
    offset: 0,
    status: 'all',
  });

  const recentWithSummary = recentSessions.map((s) => {
    let summary: string | null = null;
    if (s.summary_enc && s.summary_iv && s.summary_auth_tag) {
      try {
        summary = decryptContent(
          s.summary_enc as unknown as Buffer,
          s.summary_iv as unknown as Buffer,
          s.summary_auth_tag as unknown as Buffer,
          key,
        );
      } catch {
        // skip
      }
    }
    return {
      id: s.id,
      title: s.title,
      agent_source: s.agent_source,
      event_count: s.ended_at ? s.event_count : getEventCount(db, s.id),
      started_at: s.started_at,
      ended_at: s.ended_at,
      summary,
    };
  });

  // Build markdown
  const lines: string[] = [];
  lines.push(`## Memex Dashboard Summary`);
  lines.push('');
  lines.push(`**Current project**: \`${project.split('/').slice(-2).join('/')}\``);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total memories | ${totalMemories} (${projectMemories} in this project) |`);
  lines.push(`| Total sessions | ${allSessions.length} (${projectSessions.length} in this project) |`);
  lines.push(`| Active sessions | ${activeSessions.length} |`);
  lines.push(`| Projects tracked | ${projects.length} |`);
  lines.push('');

  if (recentWithSummary.length > 0) {
    lines.push(`### Recent Sessions (this project)`);
    lines.push('');
    for (const s of recentWithSummary) {
      const date = new Date(s.started_at).toLocaleDateString();
      const status = s.ended_at ? '' : ' **(active)**';
      const title = s.title || 'Untitled';
      lines.push(`- **${title}**${status} — ${date}, ${s.event_count} events (${s.agent_source})`);
      if (s.summary) {
        lines.push(`  > ${s.summary.replace(/\n/g, ' ').slice(0, 150)}`);
      }
    }
  }

  return {
    project,
    overview: {
      total_memories: totalMemories,
      total_projects: projects.length,
      total_sessions: allSessions.length,
      active_sessions: activeSessions.length,
    },
    recent_sessions: recentWithSummary,
    top_projects: projects.slice(0, 5),
    markdown: lines.join('\n'),
  };
}
