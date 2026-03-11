import { NextRequest, NextResponse } from 'next/server';
import { getDb, getKey, decryptContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  try {
    const db = getDb();
    const key = getKey();
    const params = request.nextUrl.searchParams;
    const project = params.get('project') || '';
    const agent = params.get('agent') || '';
    const status = params.get('status') || 'all';
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
    const offset = parseInt(params.get('offset') || '0', 10);

    let sql = `SELECT * FROM sessions WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as count FROM sessions WHERE 1=1`;
    const bindParams: unknown[] = [];

    if (project) {
      sql += ` AND project = ?`;
      countSql += ` AND project = ?`;
      bindParams.push(project);
    }
    if (agent) {
      sql += ` AND agent_source = ?`;
      countSql += ` AND agent_source = ?`;
      bindParams.push(agent);
    }
    if (status === 'active') {
      sql += ` AND ended_at IS NULL`;
      countSql += ` AND ended_at IS NULL`;
    } else if (status === 'ended') {
      sql += ` AND ended_at IS NOT NULL`;
      countSql += ` AND ended_at IS NOT NULL`;
    }

    const total = (db.prepare(countSql).get(...bindParams) as { count: number }).count;

    sql += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(sql).all(...bindParams, limit, offset) as Array<Record<string, unknown>>;

    const sessions = rows.map((row) => {
      let summary: string | null = null;
      if (row.summary_enc && row.summary_iv && row.summary_auth_tag) {
        try {
          summary = decryptContent(
            row.summary_enc as Buffer,
            row.summary_iv as Buffer,
            row.summary_auth_tag as Buffer,
            key,
          );
        } catch {
          summary = '[decryption failed]';
        }
      }

      return {
        id: row.id as string,
        project: row.project as string,
        agent_source: row.agent_source as string,
        title: row.title as string | null,
        summary,
        tags: JSON.parse(row.tags as string) as string[],
        event_count: row.event_count as number,
        started_at: row.started_at as string,
        ended_at: row.ended_at as string | null,
      };
    });

    return NextResponse.json({ sessions, total, limit, offset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
