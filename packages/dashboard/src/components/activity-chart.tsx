'use client';

/**
 * Simple activity chart — a row of vertical bars showing daily session counts.
 * Pure CSS, no chart library needed.
 */
export function ActivityChart({
  data,
}: {
  data: Array<{ day: string; count: number }>;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-600">No activity data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  // Fill in missing days in the last 30 days
  const days: Array<{ day: string; count: number }> = [];
  const dataMap = new Map(data.map((d) => [d.day, d.count]));
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0]!;
    days.push({ day: key, count: dataMap.get(key) || 0 });
  }

  return (
    <div className="flex items-end gap-[3px] h-16">
      {days.map((d) => {
        const height = d.count > 0 ? Math.max((d.count / max) * 100, 8) : 4;
        const isToday = d.day === new Date().toISOString().split('T')[0];
        return (
          <div
            key={d.day}
            className="group relative flex-1 min-w-0"
          >
            <div
              className={`w-full rounded-sm transition-colors ${
                d.count > 0
                  ? isToday
                    ? 'bg-memex-400'
                    : 'bg-memex-600/60 group-hover:bg-memex-500'
                  : 'bg-gray-800'
              }`}
              style={{ height: `${height}%` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded whitespace-nowrap z-10">
              {d.day}: {d.count} session{d.count !== 1 ? 's' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
