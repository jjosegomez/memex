import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  try {
    const db = getDb();

    // Get projects from memories
    const memoryProjects = db.prepare(
      `SELECT project, COUNT(*) as memory_count
       FROM memories WHERE deleted_at IS NULL
       GROUP BY project`
    ).all() as Array<{ project: string; memory_count: number }>;

    // Get projects from sessions
    const sessionProjects = db.prepare(
      `SELECT project, COUNT(*) as session_count,
              SUM(event_count) as total_events,
              MAX(started_at) as last_session_at
       FROM sessions
       GROUP BY project`
    ).all() as Array<{
      project: string;
      session_count: number;
      total_events: number;
      last_session_at: string;
    }>;

    // Merge into a single project list
    const projectMap = new Map<string, {
      project: string;
      memory_count: number;
      session_count: number;
      total_events: number;
      last_session_at: string | null;
    }>();

    for (const mp of memoryProjects) {
      projectMap.set(mp.project, {
        project: mp.project,
        memory_count: mp.memory_count,
        session_count: 0,
        total_events: 0,
        last_session_at: null,
      });
    }

    for (const sp of sessionProjects) {
      const existing = projectMap.get(sp.project);
      if (existing) {
        existing.session_count = sp.session_count;
        existing.total_events = sp.total_events;
        existing.last_session_at = sp.last_session_at;
      } else {
        projectMap.set(sp.project, {
          project: sp.project,
          memory_count: 0,
          session_count: sp.session_count,
          total_events: sp.total_events,
          last_session_at: sp.last_session_at,
        });
      }
    }

    const projects = Array.from(projectMap.values()).sort((a, b) => {
      // Sort by most recent activity
      const aDate = a.last_session_at || '';
      const bDate = b.last_session_at || '';
      return bDate.localeCompare(aDate);
    });

    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
