export type Role = "admin" | "supervisor" | "vendedor" | "cortador";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  full_name: string;
  identification_number: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlassColor {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlassThickness {
  id: string;
  organization_id: string;
  thickness_mm: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlassProduct {
  id: string;
  organization_id: string;
  color_id: string;
  thickness_id: string;
  internal_code: string;
  name: string;
  default_kerf_mm: number | null;
  default_margin_mm: number | null;
  default_separation_mm: number | null;
  default_edge_margin_mm: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SheetType {
  id: string;
  organization_id: string;
  name: string;
  width_mm: number;
  height_mm: number;
  default_cost_cents: number;
  minimum_usable_area_mm2: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventorySheet {
  id: string;
  organization_id: string;
  sheet_type_id: string;
  glass_product_id: string;
  quantity: number;
  unit_cost_cents: number;
  status: "available" | "reserved" | "depleted" | "discarded";
  location: string | null;
  batch_reference: string | null;
  created_at: string;
  updated_at: string;
}

export type RemnantStatus = "available" | "reserved" | "consumed" | "discarded";

export interface Remnant {
  id: string;
  organization_id: string;
  glass_product_id: string;
  width_mm: number;
  height_mm: number;
  shape_type: "rectangle";
  geometry_json: Record<string, unknown> | null;
  quantity: number;
  minimum_usable_flag: boolean;
  status: RemnantStatus;
  source_cutting_job_id: string | null;
  source_layout_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "draft" | "pending" | "queued" | "in_progress" | "completed" | "cancelled";

export interface Order {
  id: string;
  organization_id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  requested_at: string;
  due_at: string | null;
  reference: string | null;
  notes: string | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type PieceStatus = "pending" | "assigned" | "cut" | "cancelled";

export interface OrderItem {
  id: string;
  organization_id: string;
  order_id: string;
  glass_product_id: string;
  name: string | null;
  piece_type: "rectangle";
  quantity: number;
  width_mm: number;
  height_mm: number;
  rotatable: boolean;
  geometry_json: Record<string, unknown> | null;
  notes: string | null;
  status: PieceStatus;
  created_at: string;
  updated_at: string;
}

export interface Piece {
  id: string;
  organization_id: string;
  order_id: string;
  order_item_id: string;
  sequence_number: number;
  piece_code: string;
  quantity_index: number;
  geometry_type: "rectangle";
  geometry_json: Record<string, unknown>;
  requested_width_mm: number;
  requested_height_mm: number;
  area_mm2: number;
  status: PieceStatus;
  cutting_job_id: string | null;
  cutting_operation_id: string | null;
  cut_at: string | null;
  created_at: string;
}

export type JobStatus =
  | "draft"
  | "optimizing"
  | "optimized"
  | "ready"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MaterialStrategy = "sheets" | "remnants" | "mixed";

export interface CuttingJob {
  id: string;
  organization_id: string;
  job_number: string;
  status: JobStatus;
  material_strategy: MaterialStrategy;
  optimizer_version: string;
  configuration_version: string;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  total_sheet_area_mm2: number;
  total_used_area_mm2: number;
  total_waste_area_mm2: number;
  utilization_percent: number;
  waste_percent: number;
  total_material_cost_cents: number;
  total_cutting_cost_cents: number;
  total_job_cost_cents: number;
  notes: string | null;
  created_by: string;
  completed_by: string | null;
  created_at: string;
}

export interface CuttingLayout {
  id: string;
  organization_id: string;
  cutting_job_id: string;
  sequence_number: number;
  material_type: "sheet" | "remnant";
  source_id: string;
  source_instance_id: string;
  inventory_sheet_id: string | null;
  remnant_id: string | null;
  width_mm: number;
  height_mm: number;
  utilization_percent: number;
  waste_percent: number;
  geometry_json: Record<string, unknown>;
  score: number;
  is_selected: boolean;
  optimizer_version: string;
  configuration_version: string;
  created_at: string;
}

export type OperationStatus = "pending" | "in_progress" | "completed" | "skipped" | "issue";

export interface CuttingOperation {
  id: string;
  organization_id: string;
  cutting_job_id: string;
  cutting_layout_id: string;
  sequence_number: number;
  operation_type: "cut";
  target_area_id: string | null;
  target_piece_id: string | null;
  axis: "x" | "y" | null;
  position_mm: number | null;
  cut_length_mm: number | null;
  instruction: string;
  status: OperationStatus;
  completed_at: string | null;
  completed_by: string | null;
}

export type MovementType =
  | "entry"
  | "reservation"
  | "consumption"
  | "release"
  | "adjustment"
  | "discard";

export interface InventoryMovement {
  id: string;
  organization_id: string;
  glass_product_id: string;
  inventory_sheet_id: string | null;
  remnant_id: string | null;
  movement_type: MovementType;
  quantity: number;
  unit_cost_cents: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export type ReservationStatus = "active" | "consumed" | "released" | "expired";

export interface MaterialReservation {
  id: string;
  organization_id: string;
  remnant_id: string;
  cutting_job_id: string;
  status: ReservationStatus;
  quantity: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  previous_data_json: Record<string, unknown> | null;
  new_data_json: Record<string, unknown> | null;
  created_at: string;
}

export interface CuttingJobOrder {
  cutting_job_id: string;
  order_id: string;
  created_at: string;
}

export interface AdditionalService {
  id: string;
  organization_id: string;
  name: string;
  unit_type: "per_piece" | "per_square_meter" | "per_linear_meter" | "per_cut" | "fixed";
  unit_price_cents: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  organization_id: string;
  name: string;
  rule_type:
    | "per_piece"
    | "per_linear_meter"
    | "per_square_meter"
    | "per_cut"
    | "fixed"
    | "formula";
  parameter_json: Record<string, unknown>;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppData {
  organizations: Organization[];
  profiles: UserProfile[];
  customers: Customer[];
  colors: GlassColor[];
  thicknesses: GlassThickness[];
  products: GlassProduct[];
  sheetTypes: SheetType[];
  inventorySheets: InventorySheet[];
  remnants: Remnant[];
  orders: Order[];
  orderItems: OrderItem[];
  pieces: Piece[];
  jobs: CuttingJob[];
  jobOrders: CuttingJobOrder[];
  layouts: CuttingLayout[];
  operations: CuttingOperation[];
  movements: InventoryMovement[];
  reservations: MaterialReservation[];
  auditLogs: AuditLog[];
  services: AdditionalService[];
  pricingRules: PricingRule[];
}
