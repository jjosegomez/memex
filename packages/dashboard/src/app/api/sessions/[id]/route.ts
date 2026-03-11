import { NextRequest, NextResponse } from 'next/server';
import { getDb, getKey, decryptContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    const key = getKey();
    const { id } = params;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const eventType = searchParams.get('type') || '';

    // Get session
    const session = db.prepare(
      `SELECT * FROM sessions WHERE id = ?`
    ).get(id) as Record<string, unknown> | undefined;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let summary: string | null = null;
    if (session.summary_enc && session.summary_iv && session.summary_auth_tag) {
      try {
        summary = decryptContent(
          session.summary_enc as Buffer,
          session.summary_iv as Buffer,
          session.summary_auth_tag as Buffer,
          key,
        );
      } catch {
        summary = '[decryption failed]';
      }
    }

    // Get events
    let eventSql = `SELECT * FROM session_events WHERE session_id = ?`;
    const bindParams: unknown[] = [id];

    if (eventType) {
      eventSql += ` AND event_type = ?`;
      bindParams.push(eventType);
    }

    eventSql += ` ORDER BY sequence ASC LIMIT ? OFFSET ?`;
    bindParams.push(limit, offset);

    const eventRows = db.prepare(eventSql).all(...bindParams) as Array<Record<string, unknown>>;

    const eventTotal = (db.prepare(
      `SELECT COUNT(*) as count FROM session_events WHERE session_id = ?`
    ).get(id) as { count: number }).count;

    const events = eventRows.map((evt) => {
      let content = '';
      try {
        content = decryptContent(
          evt.content_enc as Buffer,
          evt.iv as Buffer,
          evt.auth_tag as Buffer,
          key,
        );
      } catch {
        content = '[decryption failed]';
      }

      return {
        id: evt.id as string,
        sequence: evt.sequence as number,
        event_type: evt.event_type as string,
        timestamp: evt.timestamp as string,
        duration_ms: evt.duration_ms as number | null,
        content,
        metadata: evt.metadata ? JSON.parse(evt.metadata as string) : null,
        agent_source: evt.agent_source as string | null,
      };
    });

    return NextResponse.json({
      session: {
        id: session.id as string,
        project: session.project as string,
        agent_source: session.agent_source as string,
        title: session.title as string | null,
        summary,
        tags: JSON.parse(session.tags as string) as string[],
        event_count: session.event_count as number,
        started_at: session.started_at as string,
        ended_at: session.ended_at as string | null,
      },
      events,
      event_total: eventTotal,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
