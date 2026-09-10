import { formatDimensions, formatPercent } from "@/lib/format";

export interface LayoutPlacementView {
  piece_id: string;
  piece_code?: string;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  rotation_deg: 0 | 90;
}

const TINTS = ["#dbe6f5", "#dcefe4", "#f3e2d6", "#f3d9db", "#e3e7f0", "#d9ebe8"];
const BORDER = "#0e376c";

export function LayoutViewer({
  widthMm,
  heightMm,
  placements,
  label,
  utilizationPercent,
  showLabels = true,
}: {
  widthMm: number;
  heightMm: number;
  placements: LayoutPlacementView[];
  label?: string;
  utilizationPercent?: number;
  showLabels?: boolean;
}) {
  const padding = Math.max(28, Math.round(Math.max(widthMm, heightMm) * 0.016));
  const viewWidth = widthMm + padding * 2;
  const viewHeight = heightMm + padding * 2;
  const labelSize = Math.max(16, Math.round(Math.min(widthMm, heightMm) * 0.02));

  return (
    <div className="w-full">
      {label || utilizationPercent !== undefined ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label ? <span className="font-display font-bold">{label}</span> : <span />}
          {utilizationPercent !== undefined ? (
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
              {formatPercent(utilizationPercent)} de uso
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="h-auto w-full"
          role="img"
          aria-label={label ?? "Plano de corte"}
        >
          <rect
            x={padding}
            y={padding}
            width={widthMm}
            height={heightMm}
            fill="#f6f7fb"
            stroke="#94a3b8"
            strokeWidth={2}
          />
          {placements.map((placement, index) => (
            <g key={placement.piece_id}>
              <rect
                x={padding + placement.x_mm}
                y={padding + placement.y_mm}
                width={placement.width_mm}
                height={placement.height_mm}
                fill={TINTS[index % TINTS.length]}
                stroke={BORDER}
                strokeWidth={1.5}
              />
              {showLabels ? (
                <>
                  <text
                    x={padding + placement.x_mm + placement.width_mm / 2}
                    y={padding + placement.y_mm + placement.height_mm / 2 - labelSize * 0.1}
                    textAnchor="middle"
                    fontSize={labelSize}
                    fontWeight={700}
                    fill={BORDER}
                  >
                    {placement.piece_code ?? placement.piece_id.slice(0, 6)}
                  </text>
                  <text
                    x={padding + placement.x_mm + placement.width_mm / 2}
                    y={padding + placement.y_mm + placement.height_mm / 2 + labelSize}
                    textAnchor="middle"
                    fontSize={labelSize * 0.78}
                    fill="#475569"
                  >
                    {formatDimensions(placement.width_mm, placement.height_mm)}
                  </text>
                </>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
