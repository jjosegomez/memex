import { NextRequest, NextResponse } from 'next/server';
import { getDb, getKey, decryptContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  try {
    const db = getDb();
    const key = getKey();
    const params = request.nextUrl.searchParams;
    const query = params.get('q') || '';
    const project = params.get('project') || '';
    const tag = params.get('tag') || '';
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
    const offset = parseInt(params.get('offset') || '0', 10);

    let rows: Array<Record<string, unknown>>;
    let total: number;

    if (query) {
      // FTS search
      const sanitized = query
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .map((t) => `"${t.replace(/"/g, '""')}"`)
        .join(' ');

      let sql = `
        SELECT m.*, fts.rank
        FROM memories_fts fts
        JOIN memories m ON m.id = fts.id
        WHERE memories_fts MATCH ?
          AND m.deleted_at IS NULL
      `;
      const bindParams: unknown[] = [sanitized];

      if (project) {
        sql += ` AND m.project = ?`;
        bindParams.push(project);
      }
      if (tag) {
        sql += ` AND EXISTS (SELECT 1 FROM json_each(m.tags) je WHERE je.value = ?)`;
        bindParams.push(tag);
      }

      sql += ` ORDER BY fts.rank LIMIT ? OFFSET ?`;
      bindParams.push(limit, offset);

      rows = db.prepare(sql).all(...bindParams) as Array<Record<string, unknown>>;
      total = rows.length; // FTS doesn't easily give total count
    } else {
      // Browse by recency
      let countSql = `SELECT COUNT(*) as count FROM memories WHERE deleted_at IS NULL`;
      let sql = `SELECT * FROM memories WHERE deleted_at IS NULL`;
      const bindParams: unknown[] = [];

      if (project) {
        countSql += ` AND project = ?`;
        sql += ` AND project = ?`;
        bindParams.push(project);
      }
      if (tag) {
        const tagCond = ` AND EXISTS (SELECT 1 FROM json_each(tags) je WHERE je.value = ?)`;
        countSql += tagCond;
        sql += tagCond;
        bindParams.push(tag);
      }

      total = (db.prepare(countSql).get(...bindParams) as { count: number }).count;

      sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      rows = db.prepare(sql).all(...bindParams, limit, offset) as Array<Record<string, unknown>>;
    }

    // Decrypt content
    const memories = rows.map((row) => {
      let content = '';
      try {
        content = decryptContent(
          row.content_enc as Buffer,
          row.iv as Buffer,
          row.auth_tag as Buffer,
          key,
        );
      } catch {
        content = '[decryption failed]';
      }

      return {
        id: row.id as string,
        project: row.project as string,
        content,
        tags: JSON.parse(row.tags as string) as string[],
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      };
    });

    return NextResponse.json({ memories, total, limit, offset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
