import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground">{Math.round(clamped)}% read</p>
      )}
    </div>
  );
}
