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

const FILLS = ["#bae6fd", "#bbf7d0", "#fde68a", "#fecaca", "#ddd6fe", "#a7f3d0", "#fbcfe8"];

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
  const padding = Math.max(20, Math.round(Math.max(widthMm, heightMm) * 0.01));
  const viewWidth = widthMm + padding * 2;
  const viewHeight = heightMm + padding * 2;
  const labelSize = Math.max(14, Math.round(Math.min(widthMm, heightMm) * 0.018));

  return (
    <div className="w-full">
      {label || utilizationPercent !== undefined ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label ? <span className="font-medium">{label}</span> : <span />}
          {utilizationPercent !== undefined ? (
            <span className="text-emerald-700">{formatPercent(utilizationPercent)} de uso</span>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="h-auto w-full"
          role="img"
          aria-label={label ?? "Plano de corte"}
        >
          <rect x={padding} y={padding} width={widthMm} height={heightMm} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2} />
          {placements.map((placement, index) => (
            <g key={placement.piece_id}>
              <rect
                x={padding + placement.x_mm}
                y={padding + placement.y_mm}
                width={placement.width_mm}
                height={placement.height_mm}
                fill={FILLS[index % FILLS.length]}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
              {showLabels ? (
                <>
                  <text
                    x={padding + placement.x_mm + placement.width_mm / 2}
                    y={padding + placement.y_mm + placement.height_mm / 2 - labelSize * 0.2}
                    textAnchor="middle"
                    fontSize={labelSize}
                    fontWeight={600}
                    fill="#0f172a"
                  >
                    {placement.piece_code ?? placement.piece_id.slice(0, 6)}
                  </text>
                  <text
                    x={padding + placement.x_mm + placement.width_mm / 2}
                    y={padding + placement.y_mm + placement.height_mm / 2 + labelSize}
                    textAnchor="middle"
                    fontSize={labelSize * 0.8}
                    fill="#334155"
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
