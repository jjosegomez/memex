'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Project {
  project: string;
  memory_count: number;
  session_count: number;
  total_events: number;
  last_session_at: string | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">{projects.length} projects tracked</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-600 py-8 text-center">No projects yet.</p>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => {
            const shortName = p.project.split('/').slice(-2).join('/');
            return (
              <div
                key={p.project}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-200">{shortName}</h3>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{p.project}</p>
                  </div>
                  {p.last_session_at && (
                    <span className="text-xs text-gray-600 shrink-0">
                      Last active {new Date(p.last_session_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <div>
                    <span className="text-lg font-bold text-gray-200">{p.memory_count}</span>
                    <span className="text-xs text-gray-500 ml-1">memories</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-200">{p.session_count}</span>
                    <span className="text-xs text-gray-500 ml-1">sessions</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-200">{p.total_events.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-1">events</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <Link
                      href={`/memories?project=${encodeURIComponent(p.project)}`}
                      className="text-xs text-memex-400 hover:text-memex-300"
                    >
                      Memories
                    </Link>
                    <Link
                      href={`/sessions?project=${encodeURIComponent(p.project)}`}
                      className="text-xs text-memex-400 hover:text-memex-300"
                    >
                      Sessions
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
