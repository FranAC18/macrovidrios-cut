import { rectContains, rectsOverlap, type Rect } from "./geometry";
import type { NormalizedPiece, NormalizedSource } from "./normalize";
import type { PackedBin } from "./placement";
import type { Placement, ValidationReport } from "./types";

interface PlacementWithSource {
  placement: Placement;
  source: NormalizedSource;
}

function gapForAxis(
  a: Rect,
  b: Rect,
  axis: "x" | "y",
): number {
  if (axis === "x") {
    if (a.y >= b.y + b.height || b.y >= a.y + a.height) return Number.POSITIVE_INFINITY;
    return Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width));
  }
  if (a.x >= b.x + b.width || b.x >= a.x + a.width) return Number.POSITIVE_INFINITY;
  return Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height));
}

export function validatePlacements(
  bins: PackedBin[],
  pieces: NormalizedPiece[],
  requiredPieceIds: string[],
  separationMm: number,
): ValidationReport {
  const issues: string[] = [];
  const byId = new Map<string, PlacementWithSource>();

  for (const bin of bins) {
    for (const placement of bin.placements) {
      if (byId.has(placement.piece_id)) {
        issues.push(`La pieza ${placement.piece_id} aparece mas de una vez.`);
      }
      byId.set(placement.piece_id, { placement, source: bin.source });
    }
  }

  for (const pieceId of requiredPieceIds) {
    if (!byId.has(pieceId)) {
      issues.push(`La pieza ${pieceId} no fue asignada.`);
    }
  }

  for (const { placement, source } of byId.values()) {
    const rect: Rect = {
      x: placement.x_mm,
      y: placement.y_mm,
      width: placement.width_mm,
      height: placement.height_mm,
    };
    const usable: Rect = {
      x: source.margin_mm,
      y: source.margin_mm,
      width: source.usable_width_mm,
      height: source.usable_height_mm,
    };
    if (!rectContains(usable, rect)) {
      issues.push(`La pieza ${placement.piece_id} sale del area util de ${placement.source_id}.`);
    }
  }

  const grouped = new Map<string, Placement[]>();
  for (const { placement } of byId.values()) {
    const list = grouped.get(placement.source_id) ?? [];
    list.push(placement);
    grouped.set(placement.source_id, list);
  }

  for (const [sourceId, list] of grouped) {    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        const rectA: Rect = { x: a.x_mm, y: a.y_mm, width: a.width_mm, height: a.height_mm };
        const rectB: Rect = { x: b.x_mm, y: b.y_mm, width: b.width_mm, height: b.height_mm };
        if (rectsOverlap(rectA, rectB)) {
          issues.push(`Las piezas ${a.piece_id} y ${b.piece_id} se superponen en ${sourceId}.`);
          continue;
        }
        const gapX = gapForAxis(rectA, rectB, "x");
        const gapY = gapForAxis(rectA, rectB, "y");
        const gap = Math.min(gapX, gapY);
        if (Number.isFinite(gap) && gap + 0.001 < separationMm) {
          issues.push(
            `Las piezas ${a.piece_id} y ${b.piece_id} estan a ${gap} mm, menor a la separacion minima (${separationMm} mm).`,
          );
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
