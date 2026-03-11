import { NextResponse } from 'next/server';
import { getDb, getKey, decryptContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  try {
    const db = getDb();
    const key = getKey();

    // Memory stats
    const memoryCount = (db.prepare(
      `SELECT COUNT(*) as count FROM memories WHERE deleted_at IS NULL`
    ).get() as { count: number }).count;

    const projectRows = db.prepare(
      `SELECT project, COUNT(*) as count FROM memories WHERE deleted_at IS NULL GROUP BY project ORDER BY count DESC`
    ).all() as Array<{ project: string; count: number }>;

    // Session stats
    const sessionCount = (db.prepare(
      `SELECT COUNT(*) as count FROM sessions`
    ).get() as { count: number }).count;

    const activeSessionCount = (db.prepare(
      `SELECT COUNT(*) as count FROM sessions WHERE ended_at IS NULL`
    ).get() as { count: number }).count;

    const eventCount = (db.prepare(
      `SELECT COUNT(*) as count FROM session_events`
    ).get() as { count: number }).count;

    // Agent breakdown
    const agentRows = db.prepare(
      `SELECT agent_source, COUNT(*) as count FROM sessions GROUP BY agent_source ORDER BY count DESC`
    ).all() as Array<{ agent_source: string; count: number }>;

    // Recent sessions (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentSessionCount = (db.prepare(
      `SELECT COUNT(*) as count FROM sessions WHERE started_at > ?`
    ).get(weekAgo) as { count: number }).count;

    // Tag cloud (top 20 tags across memories)
    const tagRows = db.prepare(
      `SELECT je.value as tag, COUNT(*) as count
       FROM memories, json_each(memories.tags) je
       WHERE deleted_at IS NULL
       GROUP BY je.value
       ORDER BY count DESC
       LIMIT 20`
    ).all() as Array<{ tag: string; count: number }>;

    // Activity by day (last 30 days) - sessions started per day
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dailyActivity = db.prepare(
      `SELECT DATE(started_at) as day, COUNT(*) as count
       FROM sessions
       WHERE started_at > ?
       GROUP BY DATE(started_at)
       ORDER BY day ASC`
    ).all(monthAgo) as Array<{ day: string; count: number }>;

    return NextResponse.json({
      memories: {
        total: memoryCount,
        projects: projectRows,
      },
      sessions: {
        total: sessionCount,
        active: activeSessionCount,
        events: eventCount,
        recent_week: recentSessionCount,
        by_agent: agentRows,
      },
      tags: tagRows,
      daily_activity: dailyActivity,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
