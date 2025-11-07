import type { CSSProperties } from "react";

type ProgressDonutProps = {
  value: number;
  label: string;
  accentColor?: string;
  size?: number;
};

const clampPercentage = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

export function ProgressDonut({
  value,
  label,
  accentColor = "#0ea5e9",
  size = 64,
}: ProgressDonutProps) {
  const normalized = clampPercentage(value);
  const remainderColor = "rgba(148, 163, 184, 0.25)";

  const circleStyle = {
    width: size,
    height: size,
    background: `conic-gradient(${accentColor} ${normalized}%, ${remainderColor} ${normalized}% 100%)`,
  } satisfies CSSProperties;

  return (
    <div className="flex items-center gap-3 text-left">
      <div
        aria-hidden
        role="presentation"
        className="flex items-center justify-center rounded-full border border-white/5"
        style={circleStyle}
      >
        <span className="text-sm font-semibold text-white">
          {Math.round(normalized)}%
        </span>
      </div>
      <dl className="flex-1 text-xs text-slate-400">
        <dt className="sr-only">Progreso</dt>
        <dd>{label}</dd>
      </dl>
    </div>
  );
}
