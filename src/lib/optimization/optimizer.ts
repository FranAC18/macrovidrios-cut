import { buildGuillotine } from "./guillotine";
import { normalizeRequest, type NormalizedPiece, type NormalizedRequest, type NormalizedSource } from "./normalize";
import { packPieces, pieceOrderings, type PackedBin } from "./placement";
import { computeScore } from "./scoring";
import {
  OPTIMIZER_VERSION,
  RESULT_VERSION,
  type AlternativeSummary,
  type MaterialUsage,
  type OptimizationRequest,
  type OptimizationResult,
  type OptimizationStatus,
} from "./types";
import { validatePlacements } from "./validate";

interface Candidate {
  label: string;
  bins: PackedBin[];
  unplaced: NormalizedPiece[];
  utilizationPercent: number;
  wastePercent: number;
  sourceArea: number;
  usedArea: number;
  operationsCount: number;
  materialCost: number;
  score: number;
  validationValid: boolean;
}

function aggregateMaterials(bins: PackedBin[]): MaterialUsage[] {
  const map = new Map<string, MaterialUsage>();
  for (const bin of bins) {
    const source = bin.source;
    const id = source.source.source_id;
    const existing = map.get(id);
    const fullArea = source.source.width_mm * source.source.height_mm;
    if (existing) {
      existing.quantity += 1;
      existing.used_area_mm2 += bin.used_area_mm2;
      existing.source_area_mm2 += fullArea;
      existing.waste_area_mm2 += fullArea - bin.used_area_mm2;
      existing.cost_cents += bin.cost_cents;
      existing.instance_ids.push(bin.instance_id);
    } else {
      map.set(id, {
        source_id: id,
        instance_ids: [bin.instance_id],
        kind: source.source.kind,
        width_mm: source.source.width_mm,
        height_mm: source.source.height_mm,
        quantity: 1,
        source_area_mm2: fullArea,
        used_area_mm2: bin.used_area_mm2,
        waste_area_mm2: fullArea - bin.used_area_mm2,
        cost_cents: bin.cost_cents,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function fitsAnySource(
  piece: NormalizedPiece,
  sources: NormalizedSource[],
  allowRotation: boolean,
): boolean {
  const orientations = allowRotation && piece.rotatable
    ? [
        [piece.width_mm, piece.height_mm],
        [piece.height_mm, piece.width_mm],
      ]
    : [[piece.width_mm, piece.height_mm]];
  return sources.some((source) =>
    orientations.some(
      ([w, h]) => w <= source.usable_width_mm && h <= source.usable_height_mm,
    ),
  );
}

function allowedSources(
  normalized: NormalizedRequest,
  strategy: OptimizationRequest["strategy"],
): NormalizedSource[] {
  if (strategy === "sheets") return normalized.sheets;
  if (strategy === "remnants") return normalized.remnants;
  return [...normalized.remnants, ...normalized.sheets];
}

function evaluateCandidate(
  request: OptimizationRequest,
  normalized: NormalizedRequest,
  label: string,
  order: (a: NormalizedPiece, b: NormalizedPiece) => number,
): Candidate {
  const { bins, unplaced } = packPieces(normalized.pieces, normalized, {
    allowRotation: request.constraints.allow_rotation,
    strategy: request.strategy,
    maxSources: request.constraints.max_sources,
    pieceOrder: order,
  });

  const guillotine = buildGuillotine(bins);
  const validation = validatePlacements(
    bins,
    normalized.pieces,
    normalized.pieces.map((p) => p.piece_id),
    request.material.separation_mm,
  );

  const sourceArea = bins.reduce(
    (sum, bin) => sum + bin.source.source.width_mm * bin.source.source.height_mm,
    0,
  );
  const usedArea = bins.reduce((sum, bin) => sum + bin.used_area_mm2, 0);
  const wasteArea = Math.max(0, sourceArea - usedArea);
  const utilizationPercent = sourceArea > 0 ? (usedArea / sourceArea) * 100 : 0;
  const wastePercent = sourceArea > 0 ? (wasteArea / sourceArea) * 100 : 0;
  const materialCost = bins.reduce((sum, bin) => sum + bin.cost_cents, 0);
  const constraintsViolated = unplaced.length > 0 || !validation.valid;

  const breakdown = computeScore({
    utilizationPercent,
    piecesCount: normalized.pieces.length,
    operationsCount: guillotine.operations.length,
    sourcesUsed: bins.length,
    weights: request.objective_weights,
    constraintsViolated,
  });

  return {
    label,
    bins,
    unplaced,
    utilizationPercent,
    wastePercent,
    sourceArea,
    usedArea,
    operationsCount: guillotine.operations.length,
    materialCost,
    score: breakdown.score,
    validationValid: validation.valid,
  };
}

function toSummary(candidate: Candidate): AlternativeSummary {
  return {
    label: candidate.label,
    utilization_percent: Math.round(candidate.utilizationPercent * 100) / 100,
    waste_percent: Math.round(candidate.wastePercent * 100) / 100,
    sources_used: candidate.bins.length,
    operations_count: candidate.operationsCount,
    material_cost_cents: candidate.materialCost,
    score: candidate.score,
  };
}

export function optimize(request: OptimizationRequest): OptimizationResult {
  const startedAt = Date.now();
  const optimizerVersion = request.optimizer_version || OPTIMIZER_VERSION;
  const normalized = normalizeRequest(request);
  const emptyResult = (
    status: OptimizationStatus,
    reason: string,
  ): OptimizationResult => ({
    result_version: RESULT_VERSION,
    status,
    reason,
    materials: [],
    placements: [],
    areas: [],
    operations: [],
    utilization_percent: 0,
    waste_percent: 0,
    used_area_mm2: 0,
    waste_area_mm2: 0,
    source_area_mm2: 0,
    material_cost_cents: 0,
    score: 0,
    alternatives: [],
    validation: { valid: false, issues: [reason] },
    metrics: { duration_ms: Date.now() - startedAt, candidates_evaluated: 0 },
    optimizer_version: optimizerVersion,
    configuration_version: request.configuration_version,
    strategy: request.strategy,
  });

  if (normalized.pieces.length === 0) {
    return emptyResult("infeasible", normalized.issues[0] ?? "No hay piezas para optimizar.");
  }

  const sources = allowedSources(normalized, request.strategy);
  if (sources.length === 0) {
    return emptyResult(
      "infeasible",
      "No hay material compatible disponible para la estrategia seleccionada.",
    );
  }

  const impossible = normalized.pieces.filter(
    (piece) => !fitsAnySource(piece, sources, request.constraints.allow_rotation),
  );
  if (impossible.length > 0) {
    const detail = impossible
      .slice(0, 3)
      .map((piece) => `${piece.piece_id} (${piece.width_mm}x${piece.height_mm} mm)`)
      .join(", ");
    return emptyResult(
      "infeasible",
      `Estas piezas no caben en ninguna fuente disponible: ${detail}.`,
    );
  }

  const orderings = pieceOrderings();
  const candidates: Candidate[] = [];
  for (const [label, order] of Object.entries(orderings)) {
    candidates.push(evaluateCandidate(request, normalized, label, order));
  }

  candidates.sort((a, b) => {
    if (a.validationValid !== b.validationValid) return a.validationValid ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.materialCost - b.materialCost;
  });

  const best = candidates[0];
  const { operations, areas } = buildGuillotine(best.bins);
  const placements = best.bins.flatMap((bin) => bin.placements);
  const materials = aggregateMaterials(best.bins);

  const status: OptimizationStatus =
    best.unplaced.length === 0 && best.validationValid
      ? "ok"
      : best.bins.length > 0
        ? "partial"
        : "infeasible";

  const reason =
    status === "ok"
      ? undefined
      : best.unplaced.length > 0
        ? `No fue posible asignar ${best.unplaced.length} pieza(s): ${best.unplaced
            .slice(0, 3)
            .map((p) => p.piece_id)
            .join(", ")}.`
        : "La solucion no supera la validacion geometrica.";

  const alternatives = candidates
    .filter((candidate) => candidate.validationValid)
    .slice(0, 3)
    .map(toSummary);

  return {
    result_version: RESULT_VERSION,
    status,
    reason,
    materials,
    placements,
    areas,
    operations,
    utilization_percent: Math.round(best.utilizationPercent * 100) / 100,
    waste_percent: Math.round(best.wastePercent * 100) / 100,
    used_area_mm2: best.usedArea,
    waste_area_mm2: Math.max(0, best.sourceArea - best.usedArea),
    source_area_mm2: best.sourceArea,
    material_cost_cents: best.materialCost,
    score: best.score,
    alternatives,
    validation: {
      valid: best.validationValid && best.unplaced.length === 0,
      issues: best.unplaced.map((p) => `Pieza ${p.piece_id} sin asignar.`),
    },
    metrics: {
      duration_ms: Date.now() - startedAt,
      candidates_evaluated: candidates.length,
    },
    optimizer_version: optimizerVersion,
    configuration_version: request.configuration_version,
    strategy: request.strategy,
  };
}
