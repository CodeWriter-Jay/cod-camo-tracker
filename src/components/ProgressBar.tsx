import type { Completion } from "../lib/progress";

interface ProgressBarProps extends Completion {
  label?: string;
}

export function ProgressBar({ completed, total, label }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div
      className={percent === 100 ? "progress is-full" : "progress"}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
