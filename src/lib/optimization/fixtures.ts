import {
  OPTIMIZER_VERSION,
  REQUEST_VERSION,
  type OptimizationPiece,
  type OptimizationRequest,
  type RemnantSource,
  type SheetSource,
} from "./types";

export const DEVELOPMENT_MATERIAL = {
  material_id: "claro-6mm",
  color: "Claro",
  thickness_mm: 6,
  kerf_mm: 3,
  margin_mm: 10,
  separation_mm: 0,
};

export const DEVELOPMENT_SHEET: SheetSource = {
  kind: "sheet",
  source_id: "plancha-3210x2140",
  width_mm: 3210,
  height_mm: 2140,
  unit_cost_cents: 850000,
};

export const DEVELOPMENT_REMNANT: RemnantSource = {
  kind: "remnant",
  source_id: "retazo-1200x750",
  width_mm: 1200,
  height_mm: 750,
  cost_cents: 120000,
  shape: "rectangle",
  quantity: 1,
};

export function piece(
  piece_id: string,
  width_mm: number,
  height_mm: number,
  options: Partial<OptimizationPiece> = {},
): OptimizationPiece {
  return {
    piece_id,
    order_id: options.order_id ?? null,
    width_mm,
    height_mm,
    quantity_index: options.quantity_index ?? 0,
    rotatable: options.rotatable ?? true,
    material_id: options.material_id ?? DEVELOPMENT_MATERIAL.material_id,
    label: options.label,
  };
}

export function repeatPiece(
  prefix: string,
  width_mm: number,
  height_mm: number,
  quantity: number,
  options: Partial<OptimizationPiece> = {},
): OptimizationPiece[] {
  return Array.from({ length: quantity }, (_, index) =>
    piece(`${prefix}-${index + 1}`, width_mm, height_mm, {
      ...options,
      quantity_index: index,
    }),
  );
}

export function sampleRequest(
  overrides: Partial<OptimizationRequest> = {},
): OptimizationRequest {
  const pieces: OptimizationPiece[] = [
    ...repeatPiece("A-1200x800", 1200, 800, 2, { order_id: "MV-00231" }),
    ...repeatPiece("A-900x600", 900, 600, 2, { order_id: "MV-00231" }),
    ...repeatPiece("B-1000x500", 1000, 500, 2, { order_id: "MV-00234" }),
    ...repeatPiece("B-600x400", 600, 400, 3, { order_id: "MV-00234" }),
  ];

  return {
    request_version: REQUEST_VERSION,
    pieces,
    material: DEVELOPMENT_MATERIAL,
    sources: {
      sheets: [DEVELOPMENT_SHEET],
      remnants: [DEVELOPMENT_REMNANT],
    },
    constraints: {
      allow_rotation: true,
      allow_sheets: true,
      allow_remnants: true,
    },
    objective_weights: {
      efficiency: 70,
      cut_ease: 20,
      operation_count: 10,
    },
    random_seed: 1,
    optimizer_version: OPTIMIZER_VERSION,
    configuration_version: "dev-1",
    strategy: "mixed",
    ...overrides,
  };
}
