'use client';

import { useEffect, useState, useCallback } from 'react';
import { TagBadge } from '@/components/tag-badge';

interface Memory {
  id: string;
  project: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const fetchMemories = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    fetch(`/api/memories?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMemories(data.memories || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, offset]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearch(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Memories</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} memories stored {search && `matching "${search}"`}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-memex-500 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-memex-600 hover:bg-memex-500 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSearch(''); setOffset(0); }}
            className="px-3 py-2 text-gray-400 hover:text-gray-200 text-sm"
          >
            Clear
          </button>
        )}
      </form>

      <div className="flex gap-6">
        {/* Memory list */}
        <div className="flex-1 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <p className="text-sm text-gray-600 py-8 text-center">No memories found.</p>
          ) : (
            <>
              {memories.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selected?.id === m.id
                      ? 'bg-memex-600/10 border-memex-600/40'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <p className="text-sm text-gray-200 line-clamp-2">{m.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-600 font-mono">{m.id.slice(0, 14)}</span>
                    <span className="text-[10px] text-gray-600">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                    {m.tags.slice(0, 3).map((t) => (
                      <TagBadge key={t} tag={t} />
                    ))}
                  </div>
                </button>
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
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-96 shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-gray-500">{selected.id}</span>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-600 hover:text-gray-400 text-sm"
              >
                &times;
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-1 font-mono truncate">
              {selected.project}
            </div>
            <div className="text-xs text-gray-600 mb-4">
              Created {new Date(selected.created_at).toLocaleString()}
            </div>
            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selected.tags.map((t) => (
                  <TagBadge key={t} tag={t} />
                ))}
              </div>
            )}
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-[60vh] overflow-y-auto">
              {selected.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
