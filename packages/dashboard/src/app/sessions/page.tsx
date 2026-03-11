'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TagBadge } from '@/components/tag-badge';

interface Session {
  id: string;
  project: string;
  agent_source: string;
  title: string | null;
  summary: string | null;
  tags: string[];
  event_count: number;
  started_at: string;
  ended_at: string | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const limit = 30;

  const fetchSessions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetch(`/api/sessions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offset, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">{total} sessions recorded</p>
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
          {['all', 'active', 'ended'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setOffset(0); }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                statusFilter === s
                  ? 'bg-memex-600/20 text-memex-300'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-600 py-8 text-center">
          No sessions found. Run &lsquo;memex sessions ingest&rsquo; to import agent sessions.
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      s.ended_at ? 'bg-gray-600' : 'bg-green-400 animate-pulse'
                    }`} />
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {s.title || 'Untitled session'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-600 shrink-0">
                      {s.id.slice(0, 14)}
                    </span>
                  </div>
                  {s.summary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 ml-4">
                      {s.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 ml-4">
                    <span className="text-[10px] text-gray-600 font-mono">{s.agent_source}</span>
                    <span className="text-[10px] text-gray-600">
                      {new Date(s.started_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {s.event_count} events
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono truncate max-w-[200px]">
                      {s.project.split('/').slice(-2).join('/')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-3">
                  {s.tags.slice(0, 3).map((t) => (
                    <TagBadge key={t} tag={t} />
                  ))}
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              {offset + 1}&ndash;{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
