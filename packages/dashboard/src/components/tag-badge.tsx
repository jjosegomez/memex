export function TagBadge({ tag, count }: { tag: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-memex-600/20 text-memex-300 border border-memex-600/30">
      {tag}
      {count !== undefined && (
        <span className="text-memex-500">{count}</span>
      )}
    </span>
  );
}
