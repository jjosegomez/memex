import { Badge } from "@/components/ui/badge";

interface HealthBadgeProps {
  score: number;
  fileCount: number;
  totalPossible: number;
}

export function HealthBadge({ score }: HealthBadgeProps) {
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 66
      ? "text-emerald-400"
      : score >= 33
        ? "text-amber-400"
        : "text-red-400";

  const strokeColor =
    score >= 66
      ? "#34d399"
      : score >= 33
        ? "#fbbf24"
        : "#f87171";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71,71,71,0.3)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={`absolute text-[9px] font-semibold font-mono ${color}`}>
        {score}
      </span>
    </div>
  );
}

interface StalenessBadgeProps {
  staleness: "fresh" | "stale" | "old";
  label: string;
}

export function StalenessBadge({ staleness, label }: StalenessBadgeProps) {
  const color =
    staleness === "fresh"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : staleness === "stale"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-wider ${color}`}>
      {label}
    </Badge>
  );
}
