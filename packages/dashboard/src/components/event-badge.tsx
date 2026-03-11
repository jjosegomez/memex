const EVENT_COLORS: Record<string, string> = {
  message_user: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  message_agent: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tool_call: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  tool_result: 'bg-green-500/20 text-green-300 border-green-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
  warning: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  decision: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const EVENT_LABELS: Record<string, string> = {
  message_user: 'USER',
  message_agent: 'AGENT',
  tool_call: 'TOOL',
  tool_result: 'RESULT',
  error: 'ERROR',
  warning: 'WARN',
  decision: 'DECISION',
};

export function EventBadge({ type }: { type: string }) {
  const colors = EVENT_COLORS[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const label = EVENT_LABELS[type] || type;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${colors}`}>
      {label}
    </span>
  );
}
