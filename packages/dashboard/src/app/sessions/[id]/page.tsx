'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EventBadge } from '@/components/event-badge';
import { TagBadge } from '@/components/tag-badge';

interface SessionDetail {
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

interface SessionEvent {
  id: string;
  sequence: number;
  event_type: string;
  timestamp: string;
  duration_ms: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  agent_source: string | null;
}

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (typeFilter) params.set('type', typeFilter);

    fetch(`/api/sessions/${id}?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data.session);
          setEvents(data.events || []);
          setEventTotal(data.event_total || 0);
        }
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [id, typeFilter]);

  if (error) {
    return (
      <div className="max-w-2xl">
        <Link href="/sessions" className="text-sm text-memex-400 hover:text-memex-300 mb-4 inline-block">
          &larr; Back to sessions
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 bg-gray-800 rounded" />
        <div className="h-32 bg-gray-800 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const eventTypes = [...new Set(events.map((e) => e.event_type))];
  const duration = session.ended_at
    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  return (
    <div className="space-y-6">
      <Link href="/sessions" className="text-sm text-memex-400 hover:text-memex-300 inline-block">
        &larr; Back to sessions
      </Link>

      {/* Session header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            session.ended_at ? 'bg-gray-600' : 'bg-green-400 animate-pulse'
          }`} />
          <h1 className="text-xl font-bold">{session.title || 'Untitled Session'}</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500 text-xs">ID</span>
            <p className="text-gray-300 font-mono text-xs">{session.id}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Agent</span>
            <p className="text-gray-300 font-mono">{session.agent_source}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Started</span>
            <p className="text-gray-300">{new Date(session.started_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Duration</span>
            <p className="text-gray-300">{duration !== null ? `${duration} min` : 'Active'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Project</span>
            <p className="text-gray-300 font-mono text-xs truncate">{session.project}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Events</span>
            <p className="text-gray-300">{eventTotal}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 text-xs">Tags</span>
            <div className="flex gap-1 mt-1 flex-wrap">
              {session.tags.map((t) => (
                <TagBadge key={t} tag={t} />
              ))}
            </div>
          </div>
        </div>
        {session.summary && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-gray-500 text-xs">Summary</span>
            <p className="text-sm text-gray-300 mt-1">{session.summary}</p>
          </div>
        )}
      </div>

      {/* Event type filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Filter:</span>
        <button
          onClick={() => setTypeFilter('')}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            !typeFilter ? 'bg-memex-600/20 text-memex-300' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          All
        </button>
        {eventTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
            className={`transition-colors ${typeFilter === t ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <EventBadge type={t} />
          </button>
        ))}
      </div>

      {/* Event timeline */}
      <div className="space-y-1">
        {events.map((evt) => {
          const isExpanded = expandedEvent === evt.id;
          const time = new Date(evt.timestamp);
          const timeStr = time.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          });
          const preview = evt.content.replace(/\n/g, ' ').slice(0, 150);

          return (
            <button
              key={evt.id}
              onClick={() => setExpandedEvent(isExpanded ? null : evt.id)}
              className="w-full text-left px-4 py-2.5 bg-gray-900/50 hover:bg-gray-900 border border-transparent hover:border-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-600 shrink-0 w-20">
                  {timeStr}
                </span>
                <EventBadge type={evt.event_type} />
                <span className="text-sm text-gray-400 truncate flex-1">
                  {isExpanded ? '' : preview}
                </span>
                {evt.duration_ms !== null && (
                  <span className="text-[10px] text-gray-600 shrink-0">
                    {evt.duration_ms}ms
                  </span>
                )}
              </div>
              {isExpanded && (
                <div className="mt-3 ml-[92px]">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-4 max-h-[50vh] overflow-y-auto border border-gray-800">
                    {evt.content}
                  </pre>
                  {evt.metadata && (
                    <pre className="text-xs text-gray-500 mt-2 font-mono">
                      {JSON.stringify(evt.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {events.length >= 200 && (
        <p className="text-xs text-gray-600 text-center py-4">
          Showing first 200 of {eventTotal} events
        </p>
      )}
    </div>
  );
}
