import { isPositiveInt, toMm } from "./geometry";
import type {
  MaterialSpec,
  OptimizationPiece,
  OptimizationRequest,
  RemnantSource,
  SheetSource,
  Source,
} from "./types";

export interface NormalizedPiece extends OptimizationPiece {
  area_mm2: number;
  long_mm: number;
  short_mm: number;
  original_width_mm: number;
  original_height_mm: number;
}

export interface NormalizedSource {
  source: Source;
  usable_width_mm: number;
  usable_height_mm: number;
  area_mm2: number;
  margin_mm: number;
  kerf_mm: number;
  separation_mm: number;
  quantity: number;
  cost_cents: number;
}

export interface NormalizedRequest {
  pieces: NormalizedPiece[];
  sheets: NormalizedSource[];
  remnants: NormalizedSource[];
  material: MaterialSpec;
  total_piece_area_mm2: number;
  issues: string[];
}

export interface NormalizationIssue {
  code: string;
  message: string;
}

export class NormalizationError extends Error {
  issues: NormalizationIssue[];
  constructor(issues: NormalizationIssue[]) {
    super(issues.map((i) => i.message).join("; "));
    this.name = "NormalizationError";
    this.issues = issues;
  }
}

export function expandQuantity(
  piece: Omit<OptimizationPiece, "piece_id" | "quantity_index">,
  quantity: number,
  idFactory: (index: number) => string = (index) => `${piece.material_id}-${index}`,
): OptimizationPiece[] {
  const total = Math.max(1, Math.floor(quantity));
  return Array.from({ length: total }, (_, index) => ({
    ...piece,
    piece_id: idFactory(index),
    quantity_index: index,
  }));
}

function normalizePiece(piece: OptimizationPiece): NormalizedPiece {
  const width = toMm(piece.width_mm);
  const height = toMm(piece.height_mm);
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  return {
    ...piece,
    width_mm: width,
    height_mm: height,
    area_mm2: width * height,
    long_mm: long,
    short_mm: short,
    original_width_mm: width,
    original_height_mm: height,
  };
}

function normalizeSource(
  source: Source,
  material: MaterialSpec,
  quantity: number,
  costCents: number,
): NormalizedSource {
  const width = toMm(source.width_mm);
  const height = toMm(source.height_mm);
  const usableWidth = width - 2 * material.margin_mm;
  const usableHeight = height - 2 * material.margin_mm;
  return {
    source,
    usable_width_mm: Math.max(0, usableWidth),
    usable_height_mm: Math.max(0, usableHeight),
    area_mm2: Math.max(0, usableWidth) * Math.max(0, usableHeight),
    margin_mm: material.margin_mm,
    kerf_mm: material.kerf_mm,
    separation_mm: material.separation_mm,
    quantity: Math.max(0, Math.floor(quantity)),
    cost_cents: costCents,
  };
}

export function normalizeRequest(request: OptimizationRequest): NormalizedRequest {
  const issues: NormalizationIssue[] = [];

  if (!request.pieces || request.pieces.length === 0) {
    issues.push({ code: "NO_PIECES", message: "No hay piezas para optimizar." });
  }

  const seen = new Set<string>();
  const pieces: NormalizedPiece[] = [];
  for (const raw of request.pieces ?? []) {
    if (!raw.piece_id) {
      issues.push({ code: "PIECE_WITHOUT_ID", message: "Una pieza no tiene identificador." });
      continue;
    }
    if (seen.has(raw.piece_id)) {
      issues.push({
        code: "DUPLICATE_PIECE_ID",
        message: `La pieza ${raw.piece_id} esta repetida.`,
      });
      continue;
    }
    if (!isPositiveInt(Math.round(raw.width_mm)) || !isPositiveInt(Math.round(raw.height_mm))) {
      issues.push({
        code: "INVALID_PIECE_DIMENSIONS",
        message: `La pieza ${raw.piece_id} tiene medidas invalidas.`,
      });
      continue;
    }
    seen.add(raw.piece_id);
    pieces.push(normalizePiece(raw));
  }

  const sheets = (request.sources?.sheets ?? []).map((sheet: SheetSource) =>
    normalizeSource(sheet, request.material, sheet.quantity ?? Number.MAX_SAFE_INTEGER, sheet.unit_cost_cents),
  );
  const remnants = (request.sources?.remnants ?? []).map((remnant: RemnantSource) =>
    normalizeSource(remnant, request.material, remnant.quantity ?? 1, remnant.cost_cents),
  );

  if (sheets.length === 0 && remnants.length === 0) {
    issues.push({
      code: "NO_SOURCES",
      message: "No hay planchas ni retazos disponibles para el material seleccionado.",
    });
  }

  if (request.material.kerf_mm < 0 || request.material.margin_mm < 0) {
    issues.push({
      code: "INVALID_MATERIAL_RULES",
      message: "El kerf o el margen no pueden ser negativos.",
    });
  }

  const totalPieceArea = pieces.reduce((sum, piece) => sum + piece.area_mm2, 0);

  return {
    pieces,
    sheets,
    remnants,
    material: request.material,
    total_piece_area_mm2: totalPieceArea,
    issues: issues.map((i) => i.message),
  };
}
