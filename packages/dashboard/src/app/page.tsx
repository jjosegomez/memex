'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { TagBadge } from '@/components/tag-badge';
import { ActivityChart } from '@/components/activity-chart';
import Link from 'next/link';

interface Stats {
  memories: {
    total: number;
    projects: Array<{ project: string; count: number }>;
  };
  sessions: {
    total: number;
    active: number;
    events: number;
    recent_week: number;
    by_agent: Array<{ agent_source: string; count: number }>;
  };
  tags: Array<{ tag: string; count: number }>;
  daily_activity: Array<{ day: string; count: number }>;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Memex Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-800 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Your AI agent ecosystem at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Memories"
          value={stats.memories.total}
          sub={`${stats.memories.projects.length} project${stats.memories.projects.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Sessions"
          value={stats.sessions.total}
          sub={`${stats.sessions.active} active`}
        />
        <StatCard
          label="Events"
          value={stats.sessions.events.toLocaleString()}
          sub="across all sessions"
        />
        <StatCard
          label="This Week"
          value={stats.sessions.recent_week}
          sub="sessions recorded"
        />
      </div>

      {/* Activity chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Session Activity (30 days)</h2>
        <ActivityChart data={stats.daily_activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Agents</h2>
          {stats.sessions.by_agent.length === 0 ? (
            <p className="text-sm text-gray-600">No sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.sessions.by_agent.map((a) => (
                <div key={a.agent_source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-mono">{a.agent_source}</span>
                  <span className="text-sm text-gray-500">{a.count} sessions</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top tags */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Top Tags</h2>
          {stats.tags.length === 0 ? (
            <p className="text-sm text-gray-600">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.tags.map((t) => (
                <TagBadge key={t.tag} tag={t.tag} count={t.count} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400">Projects</h2>
          <Link href="/projects" className="text-xs text-memex-400 hover:text-memex-300">
            View all
          </Link>
        </div>
        {stats.memories.projects.length === 0 ? (
          <p className="text-sm text-gray-600">No projects yet. Run &lsquo;memex init&rsquo; to get started.</p>
        ) : (
          <div className="space-y-2">
            {stats.memories.projects.slice(0, 8).map((p) => (
              <Link
                key={p.project}
                href={`/projects?p=${encodeURIComponent(p.project)}`}
                className="flex items-center justify-between py-1.5 hover:bg-gray-800/50 rounded px-2 -mx-2 transition-colors"
              >
                <span className="text-sm text-gray-300 font-mono truncate">
                  {p.project.split('/').slice(-2).join('/')}
                </span>
                <span className="text-xs text-gray-500 shrink-0 ml-3">
                  {p.count} memories
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
