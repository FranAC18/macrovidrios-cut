export type Mm = number;

export const OPTIMIZER_VERSION = "0.1.0";
export const REQUEST_VERSION = "1.0";
export const RESULT_VERSION = "1.0";

export type MaterialStrategy = "sheets" | "remnants" | "mixed";

export interface OptimizationPiece {
  piece_id: string;
  order_id: string | null;
  width_mm: Mm;
  height_mm: Mm;
  quantity_index: number;
  rotatable: boolean;
  material_id: string;
  label?: string;
}

export interface MaterialSpec {
  material_id: string;
  color: string;
  thickness_mm: number;
  kerf_mm: Mm;
  margin_mm: Mm;
  separation_mm: Mm;
}

export interface SheetSource {
  kind: "sheet";
  source_id: string;
  width_mm: Mm;
  height_mm: Mm;
  unit_cost_cents: number;
  quantity?: number;
}

export interface RemnantSource {
  kind: "remnant";
  source_id: string;
  width_mm: Mm;
  height_mm: Mm;
  cost_cents: number;
  shape: "rectangle";
  quantity?: number;
}

export type Source = SheetSource | RemnantSource;

export interface ObjectiveWeights {
  efficiency: number;
  cut_ease: number;
  operation_count: number;
}

export interface OptimizationConstraints {
  allow_rotation: boolean;
  allow_sheets: boolean;
  allow_remnants: boolean;
  max_sources?: number;
}

export interface OptimizationRequest {
  request_version: string;
  pieces: OptimizationPiece[];
  material: MaterialSpec;
  sources: {
    sheets: SheetSource[];
    remnants: RemnantSource[];
  };
  constraints: OptimizationConstraints;
  objective_weights: ObjectiveWeights;
  random_seed: number;
  optimizer_version: string;
  configuration_version: string;
  strategy: MaterialStrategy;
}

export interface Placement {
  piece_id: string;
  order_id: string | null;
  source_id: string;
  x_mm: Mm;
  y_mm: Mm;
  width_mm: Mm;
  height_mm: Mm;
  rotation_deg: 0 | 90;
}

export type AreaType = "source" | "piece" | "waste";

export interface CuttingArea {
  area_id: string;
  parent_area_id: string | null;
  source_id: string;
  x_mm: Mm;
  y_mm: Mm;
  width_mm: Mm;
  height_mm: Mm;
  area_type: AreaType;
  piece_id: string | null;
}

export type OperationType = "cut";

export interface CuttingOperation {
  sequence: number;
  type: OperationType;
  area_id: string;
  source_id: string;
  axis: "x" | "y";
  position_mm: Mm;
  length_mm: Mm;
  instruction: string;
}

export interface MaterialUsage {
  source_id: string;
  instance_ids: string[];
  kind: "sheet" | "remnant";
  width_mm: Mm;
  height_mm: Mm;
  quantity: number;
  source_area_mm2: number;
  used_area_mm2: number;
  waste_area_mm2: number;
  cost_cents: number;
}

export interface ValidationReport {
  valid: boolean;
  issues: string[];
}

export interface AlternativeSummary {
  label: string;
  utilization_percent: number;
  waste_percent: number;
  sources_used: number;
  operations_count: number;
  material_cost_cents: number;
  score: number;
}

export interface OptimizationMetrics {
  duration_ms: number;
  candidates_evaluated: number;
}

export type OptimizationStatus = "ok" | "partial" | "infeasible";

export interface OptimizationResult {
  result_version: string;
  status: OptimizationStatus;
  reason?: string;
  materials: MaterialUsage[];
  placements: Placement[];
  areas: CuttingArea[];
  operations: CuttingOperation[];
  utilization_percent: number;
  waste_percent: number;
  used_area_mm2: number;
  waste_area_mm2: number;
  source_area_mm2: number;
  material_cost_cents: number;
  score: number;
  alternatives: AlternativeSummary[];
  validation: ValidationReport;
  metrics: OptimizationMetrics;
  optimizer_version: string;
  configuration_version: string;
  strategy: MaterialStrategy;
}
