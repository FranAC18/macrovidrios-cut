import { optimize } from "@/lib/optimization/optimizer";
import type {
  OptimizationRequest,
  RemnantSource,
  SheetSource,
} from "@/lib/optimization/types";
import { OPTIMIZER_VERSION } from "@/lib/optimization/types";
import type {
  Customer,
  CuttingJob,
  CuttingLayout,
  CuttingOperation,
  GlassColor,
  GlassProduct,
  GlassThickness,
  InventorySheet,
  JobStatus,
  MaterialReservation,
  MaterialStrategy,
  Order,
  OrderItem,
  OrderStatus,
  Piece,
  Remnant,
  Role,
  SheetType,
  UserProfile,
} from "@/types/domain";
import { AppError } from "@/lib/errors";
import { assertOrderTransition } from "@/domain/orders/status";
import { addMinutes, createId, nowIso } from "./id";
import { getData } from "./store";

export interface ProductView extends GlassProduct {
  color_name: string;
  thickness_mm: number;
}

export interface OrderItemView extends OrderItem {
  product_name: string;
}

export interface OrderDetail {
  order: Order;
  customer: Customer | null;
  items: OrderItemView[];
  pieces: Piece[];
  jobs: CuttingJob[];
}

export interface JobDetail {
  job: CuttingJob;
  orders: Order[];
  layouts: CuttingLayout[];
  operations: CuttingOperation[];
  pieces: Piece[];
}

export interface RemnantView extends Remnant {
  product_name: string;
}

export interface InventorySheetView extends InventorySheet {
  product_name: string;
  sheet_type_name: string;
  width_mm: number;
  height_mm: number;
}

export interface DashboardData {
  pendingOrders: number;
  jobsInProgress: number;
  completedJobs: number;
  availableRemnants: number;
  averageUtilization: number;
  wastePercent: number;
  recentJobs: CuttingJob[];
  lowStock: InventorySheetView[];
}

export interface CreateOrderResult {
  order: Order;
}

export interface CreateJobInput {
  strategy: MaterialStrategy;
  allow_rotation: boolean;
  order_ids: string[];
  piece_ids: string[];
  sheet_type_ids: string[];
  remnant_ids: string[];
  notes: string | null;
}

function nextNumber(prefix: string, existing: string[]): string {
  const numbers = existing
    .map((value) => Number.parseInt(value.replace(/[^0-9]/g, ""), 10))
    .filter((value) => Number.isFinite(value));
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${next.toString().padStart(5, "0")}`;
}

function findProduct(data: ReturnType<typeof getData>, productId: string): GlassProduct {
  const product = data.products.find((item) => item.id === productId);
  if (!product) throw new AppError("PRODUCT_NOT_FOUND", "El material seleccionado no existe.");
  return product;
}

export class InMemoryRepository {
  private get data() {
    return getData();
  }

  private audit(
    userId: string,
    entityType: string,
    entityId: string,
    action: string,
    previous: Record<string, unknown> | null,
    next: Record<string, unknown> | null,
  ): void {
    this.data.auditLogs.push({
      id: createId(),
      organization_id: this.data.organizations[0].id,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      previous_data_json: previous,
      new_data_json: next,
      created_at: nowIso(),
    });
  }

  private pricePerM2(): number {
    const rule = this.data.pricingRules.find(
      (item) => item.rule_type === "per_square_meter" && item.active,
    );
    const value = rule?.parameter_json?.price_per_m2_cents;
    return typeof value === "number" ? value : 4500;
  }

  private pricePerPiece(): number {
    const rule = this.data.pricingRules.find(
      (item) => item.rule_type === "per_piece" && item.active,
    );
    const value = rule?.parameter_json?.price_per_piece_cents;
    return typeof value === "number" ? value : 350;
  }

  listProfiles(): UserProfile[] {
    return [...this.data.profiles];
  }

  findProfileByEmail(email: string): UserProfile | null {
    return this.data.profiles.find((profile) => profile.email === email) ?? null;
  }

  findProfileById(id: string): UserProfile | null {
    return this.data.profiles.find((profile) => profile.id === id) ?? null;
  }

  listCustomers(query?: string): Customer[] {
    const term = query?.trim().toLowerCase();
    return this.data.customers
      .filter((customer) => {
        if (!term) return true;
        return (
          customer.full_name.toLowerCase().includes(term) ||
          (customer.identification_number ?? "").includes(term) ||
          (customer.phone ?? "").includes(term)
        );
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  getCustomer(id: string): Customer | null {
    return this.data.customers.find((customer) => customer.id === id) ?? null;
  }

  createCustomer(
    input: Omit<Customer, "id" | "organization_id" | "created_at" | "updated_at">,
    userId: string,
  ): Customer {
    const timestamp = nowIso();
    const customer: Customer = {
      ...input,
      id: createId(),
      organization_id: this.data.organizations[0].id,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.customers.push(customer);
    this.audit(userId, "customer", customer.id, "create", null, { full_name: customer.full_name });
    return customer;
  }

  updateCustomer(
    id: string,
    input: Partial<Customer>,
    userId: string,
  ): Customer {
    const customer = this.getCustomer(id);
    if (!customer) throw new AppError("CUSTOMER_NOT_FOUND", "El cliente no existe.");
    Object.assign(customer, input, { updated_at: nowIso() });
    this.audit(userId, "customer", id, "update", null, { full_name: customer.full_name });
    return customer;
  }

  archiveCustomer(id: string, userId: string): Customer {
    return this.updateCustomer(id, { active: false }, userId);
  }

  listColors(): GlassColor[] {
    return [...this.data.colors].sort((a, b) => a.display_order - b.display_order);
  }

  createColor(
    input: { name: string; code: string; display_order: number; active: boolean },
    userId: string,
  ): GlassColor {
    const timestamp = nowIso();
    const color: GlassColor = {
      ...input,
      id: createId(),
      organization_id: this.data.organizations[0].id,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.colors.push(color);
    this.audit(userId, "glass_color", color.id, "create", null, { name: color.name });
    return color;
  }

  createThickness(
    input: { thickness_mm: number; active: boolean },
    userId: string,
  ): GlassThickness {
    const timestamp = nowIso();
    const thickness: GlassThickness = {
      ...input,
      id: createId(),
      organization_id: this.data.organizations[0].id,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.thicknesses.push(thickness);
    this.audit(userId, "glass_thickness", thickness.id, "create", null, {
      thickness_mm: thickness.thickness_mm,
    });
    return thickness;
  }

  createProduct(
    input: {
      color_id: string;
      thickness_id: string;
      name: string;
      internal_code: string;
      default_kerf_mm: number;
      default_margin_mm: number;
      default_separation_mm: number;
      active: boolean;
    },
    userId: string,
  ): GlassProduct {
    const timestamp = nowIso();
    const product: GlassProduct = {
      ...input,
      default_edge_margin_mm: null,
      id: createId(),
      organization_id: this.data.organizations[0].id,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.products.push(product);
    this.audit(userId, "glass_product", product.id, "create", null, { name: product.name });
    return product;
  }

  createSheetType(
    input: {
      name: string;
      width_mm: number;
      height_mm: number;
      default_cost_cents: number;
      active: boolean;
    },
    userId: string,
  ): SheetType {
    const timestamp = nowIso();
    const sheetType: SheetType = {
      ...input,
      minimum_usable_area_mm2: null,
      id: createId(),
      organization_id: this.data.organizations[0].id,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.sheetTypes.push(sheetType);
    this.audit(userId, "sheet_type", sheetType.id, "create", null, { name: sheetType.name });
    return sheetType;
  }

  createInventorySheet(
    input: {
      sheet_type_id: string;
      glass_product_id: string;
      quantity: number;
      unit_cost_cents: number;
      location: string | null;
      batch_reference: string | null;
    },
    userId: string,
  ): InventorySheet {
    const timestamp = nowIso();
    const sheet: InventorySheet = {
      ...input,
      id: createId(),
      organization_id: this.data.organizations[0].id,
      status: "available",
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.inventorySheets.push(sheet);
    this.data.movements.push({
      id: createId(),
      organization_id: sheet.organization_id,
      glass_product_id: sheet.glass_product_id,
      inventory_sheet_id: sheet.id,
      remnant_id: null,
      movement_type: "entry",
      quantity: sheet.quantity,
      unit_cost_cents: sheet.unit_cost_cents,
      reference_type: "inventory_sheet",
      reference_id: sheet.id,
      notes: null,
      created_by: userId,
      created_at: timestamp,
    });
    this.audit(userId, "inventory_sheet", sheet.id, "create", null, { quantity: sheet.quantity });
    return sheet;
  }

  listThicknesses(): GlassThickness[] {
    return [...this.data.thicknesses].sort((a, b) => a.thickness_mm - b.thickness_mm);
  }

  listProducts(): ProductView[] {
    return this.data.products.map((product) => {
      const color = this.data.colors.find((item) => item.id === product.color_id);
      const thickness = this.data.thicknesses.find((item) => item.id === product.thickness_id);
      return {
        ...product,
        color_name: color?.name ?? "—",
        thickness_mm: thickness?.thickness_mm ?? 0,
      };
    });
  }

  getProductView(id: string): ProductView | null {
    return this.listProducts().find((product) => product.id === id) ?? null;
  }

  listSheetTypes(): SheetType[] {
    return [...this.data.sheetTypes].sort((a, b) => a.name.localeCompare(b.name));
  }

  listInventorySheets(): InventorySheetView[] {
    return this.data.inventorySheets.map((sheet) => {
      const product = this.getProductView(sheet.glass_product_id);
      const sheetType = this.data.sheetTypes.find((item) => item.id === sheet.sheet_type_id);
      return {
        ...sheet,
        product_name: product?.name ?? "—",
        sheet_type_name: sheetType?.name ?? "—",
        width_mm: sheetType?.width_mm ?? 0,
        height_mm: sheetType?.height_mm ?? 0,
      };
    });
  }

  listServices() {
    return [...this.data.services].filter((service) => service.active);
  }

  listRemnants(query?: {
    product_id?: string;
    min_width?: number;
    min_height?: number;
    status?: Remnant["status"];
  }): RemnantView[] {
    return this.data.remnants
      .filter((remnant) => {
        if (query?.product_id && remnant.glass_product_id !== query.product_id) return false;
        if (query?.status && remnant.status !== query.status) return false;
        if (query?.min_width && remnant.width_mm < query.min_width) return false;
        if (query?.min_height && remnant.height_mm < query.min_height) return false;
        return true;
      })
      .map((remnant) => ({
        ...remnant,
        product_name: this.getProductView(remnant.glass_product_id)?.name ?? "—",
      }))
      .sort((a, b) => b.width_mm * b.height_mm - a.width_mm * a.height_mm);
  }

  createRemnant(
    input: {
      glass_product_id: string;
      width_mm: number;
      height_mm: number;
      quantity: number;
      location: string | null;
      notes: string | null;
      source_cutting_job_id?: string | null;
      source_layout_id?: string | null;
    },
    userId: string,
  ): Remnant {
    const timestamp = nowIso();
    const remnant: Remnant = {
      id: createId(),
      organization_id: this.data.organizations[0].id,
      glass_product_id: input.glass_product_id,
      width_mm: input.width_mm,
      height_mm: input.height_mm,
      shape_type: "rectangle",
      geometry_json: null,
      quantity: input.quantity,
      minimum_usable_flag: true,
      status: "available",
      source_cutting_job_id: input.source_cutting_job_id ?? null,
      source_layout_id: input.source_layout_id ?? null,
      location: input.location,
      notes: input.notes,
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.remnants.push(remnant);
    this.audit(userId, "remnant", remnant.id, "create", null, { size: `${input.width_mm}x${input.height_mm}` });
    return remnant;
  }

  discardRemnant(id: string, userId: string): Remnant {
    const remnant = this.data.remnants.find((item) => item.id === id);
    if (!remnant) throw new AppError("REMNANT_NOT_FOUND", "El retazo no existe.");
    if (remnant.status === "reserved") {
      throw new AppError(
        "REMNANT_RESERVED",
        "El retazo esta reservado por otro trabajo. Actualiza la lista.",
      );
    }
    remnant.status = "discarded";
    remnant.updated_at = nowIso();
    this.audit(userId, "remnant", id, "discard", null, null);
    return remnant;
  }

  private releaseReservation(reservation: MaterialReservation): void {
    const remnant = this.data.remnants.find((item) => item.id === reservation.remnant_id);
    if (remnant) {
      remnant.quantity += reservation.quantity;
      if (remnant.status === "reserved") remnant.status = "available";
      remnant.updated_at = nowIso();
    }
    reservation.status = "released";
    reservation.updated_at = nowIso();
  }

  private reserveRemnantInternal(
    remnantId: string,
    jobId: string,
    userId: string,
    ttlMinutes = 120,
  ): MaterialReservation {
    const remnant = this.data.remnants.find((item) => item.id === remnantId);
    if (!remnant) throw new AppError("REMNANT_NOT_FOUND", "El retazo no existe.");
    if (remnant.status !== "available" || remnant.quantity < 1) {
      throw new AppError(
        "REMNANT_UNAVAILABLE",
        "El retazo ya fue reservado por otro trabajo. Actualiza la lista para ver material disponible.",
      );
    }
    const timestamp = nowIso();
    remnant.quantity -= 1;
    if (remnant.quantity <= 0) remnant.status = "reserved";
    remnant.updated_at = timestamp;

    const reservation: MaterialReservation = {
      id: createId(),
      organization_id: this.data.organizations[0].id,
      remnant_id: remnantId,
      cutting_job_id: jobId,
      status: "active",
      quantity: 1,
      expires_at: addMinutes(timestamp, ttlMinutes),
      created_at: timestamp,
      updated_at: timestamp,
    };
    this.data.reservations.push(reservation);
    this.data.movements.push({
      id: createId(),
      organization_id: this.data.organizations[0].id,
      glass_product_id: remnant.glass_product_id,
      inventory_sheet_id: null,
      remnant_id: remnantId,
      movement_type: "reservation",
      quantity: 1,
      unit_cost_cents: null,
      reference_type: "cutting_job",
      reference_id: jobId,
      notes: null,
      created_by: userId,
      created_at: timestamp,
    });
    this.audit(userId, "remnant", remnantId, "reserve", null, { job: jobId });
    return reservation;
  }

  reserveRemnant(remnantId: string, jobId: string, userId: string): MaterialReservation {
    return this.reserveRemnantInternal(remnantId, jobId, userId);
  }

  releaseReservationById(reservationId: string, userId: string): void {
    const reservation = this.data.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== "active") return;
    this.releaseReservation(reservation);
    this.audit(userId, "reservation", reservationId, "release", null, null);
  }

  expireReservations(): number {
    const timestamp = nowIso();
    let count = 0;
    for (const reservation of this.data.reservations) {
      if (reservation.status === "active" && reservation.expires_at < timestamp) {
        this.releaseReservation(reservation);
        count += 1;
      }
    }
    return count;
  }

  listOrders(query?: { status?: OrderStatus; search?: string }): Order[] {
    const term = query?.search?.trim().toLowerCase();
    return this.data.orders
      .filter((order) => {
        if (query?.status && order.status !== query.status) return false;
        if (!term) return true;
        const customer = order.customer_id ? this.getCustomer(order.customer_id) : null;
        return (
          order.order_number.toLowerCase().includes(term) ||
          (order.reference ?? "").toLowerCase().includes(term) ||
          (customer?.full_name ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getOrderDetail(id: string): OrderDetail | null {
    const order = this.data.orders.find((item) => item.id === id);
    if (!order) return null;
    const customer = order.customer_id ? this.getCustomer(order.customer_id) : null;
    const items = this.data.orderItems
      .filter((item) => item.order_id === id)
      .map((item) => ({
        ...item,
        product_name: this.getProductView(item.glass_product_id)?.name ?? "—",
      }));
    const pieces = this.data.pieces.filter((piece) => piece.order_id === id);
    const jobs = this.data.jobOrders
      .filter((link) => link.order_id === id)
      .map((link) => this.data.jobs.find((job) => job.id === link.cutting_job_id))
      .filter((job): job is CuttingJob => Boolean(job));
    return { order, customer, items, pieces, jobs };
  }

  private computeOrderSubtotal(items: { width_mm: number; height_mm: number; quantity: number }[]): number {
    const perM2 = this.pricePerM2();
    const perPiece = this.pricePerPiece();
    return items.reduce((sum, item) => {
      const areaM2 = (item.width_mm * item.height_mm * item.quantity) / 1_000_000;
      return sum + Math.round(areaM2 * perM2) + item.quantity * perPiece;
    }, 0);
  }

  createOrder(
    input: {
      customer_id: string | null;
      due_at: string | null;
      reference: string | null;
      notes: string | null;
      discount_cents: number;
      items: {
        glass_product_id: string;
        name: string | null;
        quantity: number;
        width_mm: number;
        height_mm: number;
        rotatable: boolean;
        notes: string | null;
      }[];
    },
    userId: string,
  ): Order {
    const timestamp = nowIso();
    const orderId = createId();
    const subtotal = this.computeOrderSubtotal(input.items);
    const discount = Math.max(0, Math.min(input.discount_cents, subtotal));
    const order: Order = {
      id: orderId,
      organization_id: this.data.organizations[0].id,
      order_number: nextNumber(
        "MV",
        this.data.orders.map((item) => item.order_number),
      ),
      customer_id: input.customer_id,
      status: "draft",
      requested_at: timestamp,
      due_at: input.due_at,
      reference: input.reference,
      notes: input.notes,
      subtotal_cents: subtotal,
      discount_cents: discount,
      total_cents: subtotal - discount,
      created_by: userId,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null,
    };
    this.data.orders.push(order);

    for (const item of input.items) {
      this.data.orderItems.push({
        id: createId(),
        organization_id: order.organization_id,
        order_id: orderId,
        glass_product_id: item.glass_product_id,
        name: item.name,
        piece_type: "rectangle",
        quantity: item.quantity,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        rotatable: item.rotatable,
        geometry_json: null,
        notes: item.notes,
        status: "pending",
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
    this.audit(userId, "order", orderId, "create", null, { order_number: order.order_number });
    return order;
  }

  transitionOrder(id: string, status: OrderStatus, userId: string): Order {
    const order = this.data.orders.find((item) => item.id === id);
    if (!order) throw new AppError("ORDER_NOT_FOUND", "El pedido no existe.");
    assertOrderTransition(order.status, status);
    order.status = status;
    order.updated_at = nowIso();
    if (status === "completed") order.completed_at = nowIso();
    this.audit(userId, "order", id, `status:${status}`, { status: order.status }, { status });
    return order;
  }

  ensurePiecesForOrder(orderId: string): Piece[] {
    const existing = this.data.pieces.filter((piece) => piece.order_id === orderId);
    const items = this.data.orderItems.filter((item) => item.order_id === orderId);
    for (const item of items) {
      const count = existing.filter((piece) => piece.order_item_id === item.id).length;
      if (count >= item.quantity) continue;
      const maxSequence = this.data.pieces.reduce(
        (max, piece) => Math.max(max, piece.sequence_number),
        0,
      );
      for (let index = count; index < item.quantity; index += 1) {
        const sequence = maxSequence + (index - count) + 1;
        this.data.pieces.push({
          id: createId(),
          organization_id: item.organization_id,
          order_id: item.order_id,
          order_item_id: item.id,
          sequence_number: sequence,
          piece_code: `PZ-${sequence.toString().padStart(4, "0")}`,
          quantity_index: index,
          geometry_type: "rectangle",
          geometry_json: {
            type: "rectangle",
            width_mm: item.width_mm,
            height_mm: item.height_mm,
          },
          requested_width_mm: item.width_mm,
          requested_height_mm: item.height_mm,
          area_mm2: item.width_mm * item.height_mm,
          status: "pending",
          cutting_job_id: null,
          cutting_operation_id: null,
          cut_at: null,
          created_at: nowIso(),
        });
      }
    }
    return this.data.pieces.filter((piece) => piece.order_id === orderId);
  }

  listJobs(query?: { status?: JobStatus }): CuttingJob[] {
    return this.data.jobs
      .filter((job) => (query?.status ? job.status === query.status : true))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getJobDetail(id: string): JobDetail | null {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) return null;
    const orders = this.data.jobOrders
      .filter((link) => link.cutting_job_id === id)
      .map((link) => this.data.orders.find((order) => order.id === link.order_id))
      .filter((order): order is Order => Boolean(order));
    const layouts = this.data.layouts.filter((layout) => layout.cutting_job_id === id);
    const operations = this.data.operations
      .filter((operation) => operation.cutting_job_id === id)
      .sort((a, b) => a.sequence_number - b.sequence_number);
    const pieces = this.data.pieces.filter((piece) => piece.cutting_job_id === id);
    return { job, orders, layouts, operations, pieces };
  }

  private remnantCost(width: number, height: number): number {
    return Math.round(((width * height) / 1_000_000) * this.pricePerM2());
  }

  createJob(input: CreateJobInput, userId: string): CuttingJob {
    const orders = input.order_ids
      .map((id) => this.data.orders.find((order) => order.id === id))
      .filter((order): order is Order => Boolean(order));
    if (orders.length === 0) {
      throw new AppError("ORDER_REQUIRED", "Selecciona al menos un pedido valido.");
    }
    for (const order of orders) {
      if (order.status === "completed" || order.status === "cancelled") {
        throw new AppError(
          "ORDER_NOT_AVAILABLE",
          `El pedido ${order.order_number} no puede incluirse en un trabajo de corte.`,
        );
      }
    }

    let pieces: Piece[] = [];
    for (const order of orders) {
      pieces.push(...this.ensurePiecesForOrder(order.id));
    }
    if (input.piece_ids.length > 0) {
      const selected = new Set(input.piece_ids);
      pieces = pieces.filter((piece) => selected.has(piece.id));
    }
    pieces = pieces.filter((piece) => piece.status === "pending");
    if (pieces.length === 0) {
      throw new AppError("NO_PIECES", "No hay piezas disponibles para cuadrar.");
    }

    const productIdSet = new Set(
      pieces.map((piece) => {
        const item = this.data.orderItems.find((orderItem) => orderItem.id === piece.order_item_id);
        return item?.glass_product_id ?? "";
      }),
    );
    if (productIdSet.size > 1) {
      throw new AppError(
        "INCOMPATIBLE_MATERIALS",
        "Las piezas seleccionadas usan materiales distintos. Separa el cuadre por color y espesor.",
      );
    }
    const productId = [...productIdSet][0];
    const product = findProduct(this.data, productId);
    const color = this.data.colors.find((item) => item.id === product.color_id);
    const thickness = this.data.thicknesses.find((item) => item.id === product.thickness_id);
    if (!color || !thickness) {
      throw new AppError("PRODUCT_INVALID", "El material no tiene color o espesor configurado.");
    }

    const sheetSources: SheetSource[] = [];
    for (const sheet of this.data.inventorySheets) {
      if (sheet.glass_product_id !== productId) continue;
      if (sheet.status !== "available" || sheet.quantity < 1) continue;
      if (input.sheet_type_ids.length > 0 && !input.sheet_type_ids.includes(sheet.sheet_type_id)) {
        continue;
      }
      const sheetType = this.data.sheetTypes.find((item) => item.id === sheet.sheet_type_id);
      if (!sheetType) continue;
      sheetSources.push({
        kind: "sheet",
        source_id: `inv-${sheet.id}`,
        width_mm: sheetType.width_mm,
        height_mm: sheetType.height_mm,
        unit_cost_cents: sheet.unit_cost_cents,
        quantity: sheet.quantity,
      });
    }

    const remnantSources: RemnantSource[] = [];
    for (const remnant of this.data.remnants) {
      if (remnant.glass_product_id !== productId) continue;
      if (remnant.status !== "available" || remnant.quantity < 1) continue;
      if (input.remnant_ids.length > 0 && !input.remnant_ids.includes(remnant.id)) continue;
      remnantSources.push({
        kind: "remnant",
        source_id: `rem-${remnant.id}`,
        width_mm: remnant.width_mm,
        height_mm: remnant.height_mm,
        cost_cents: this.remnantCost(remnant.width_mm, remnant.height_mm),
        shape: "rectangle",
        quantity: remnant.quantity,
      });
    }

    if (input.strategy !== "remnants" && sheetSources.length === 0) {
      throw new AppError(
        "NO_SHEETS",
        "No hay planchas disponibles de este material. Registra inventario o usa retazos.",
      );
    }
    if (input.strategy !== "sheets" && remnantSources.length === 0 && input.strategy === "remnants") {
      throw new AppError(
        "NO_REMNANTS",
        "No hay retazos compatibles disponibles para este material.",
      );
    }

    const request: OptimizationRequest = {
      request_version: "1.0",
      pieces: pieces.map((piece) => ({
        piece_id: piece.id,
        order_id: piece.order_id,
        width_mm: piece.requested_width_mm,
        height_mm: piece.requested_height_mm,
        quantity_index: piece.quantity_index,
        rotatable: this.data.orderItems.find((item) => item.id === piece.order_item_id)?.rotatable ?? true,
        material_id: productId,
        label: piece.piece_code,
      })),
      material: {
        material_id: productId,
        color: color.name,
        thickness_mm: thickness.thickness_mm,
        kerf_mm: product.default_kerf_mm ?? 3,
        margin_mm: product.default_margin_mm ?? 10,
        separation_mm: product.default_separation_mm ?? 0,
      },
      sources: { sheets: sheetSources, remnants: remnantSources },
      constraints: {
        allow_rotation: input.allow_rotation,
        allow_sheets: input.strategy !== "remnants",
        allow_remnants: input.strategy !== "sheets",
      },
      objective_weights: { efficiency: 70, cut_ease: 20, operation_count: 10 },
      random_seed: 1,
      optimizer_version: OPTIMIZER_VERSION,
      configuration_version: "dev-1",
      strategy: input.strategy,
    };

    const result = optimize(request);
    if (result.status !== "ok") {
      throw new AppError(
        "OPTIMIZATION_FAILED",
        result.reason ?? "No fue posible obtener una solucion de corte valida.",
      );
    }

    const timestamp = nowIso();
    const jobId = createId();
    const job: CuttingJob = {
      id: jobId,
      organization_id: this.data.organizations[0].id,
      job_number: nextNumber(
        "TC",
        this.data.jobs.map((item) => item.job_number),
      ),
      status: "optimized",
      material_strategy: input.strategy,
      optimizer_version: result.optimizer_version,
      configuration_version: result.configuration_version,
      requested_at: timestamp,
      started_at: null,
      completed_at: null,
      total_sheet_area_mm2: result.source_area_mm2,
      total_used_area_mm2: result.used_area_mm2,
      total_waste_area_mm2: result.waste_area_mm2,
      utilization_percent: result.utilization_percent,
      waste_percent: result.waste_percent,
      total_material_cost_cents: result.material_cost_cents,
      total_cutting_cost_cents: 0,
      total_job_cost_cents: result.material_cost_cents,
      notes: input.notes,
      created_by: userId,
      completed_by: null,
      created_at: timestamp,
    };
    this.data.jobs.push(job);

    for (const order of orders) {
      this.data.jobOrders.push({ cutting_job_id: jobId, order_id: order.id, created_at: timestamp });
      if (order.status === "pending" || order.status === "draft") {
        order.status = "queued";
        order.updated_at = timestamp;
      }
    }

    let layoutSequence = 0;
    const instanceToLayout = new Map<string, CuttingLayout>();
    for (const material of result.materials) {
      const baseId = material.source_id;
      const isSheet = material.kind === "sheet";
      const inventorySheetId = isSheet ? baseId.replace(/^inv-/, "") : null;
      const remnantId = !isSheet ? baseId.replace(/^rem-/, "") : null;
      for (const instanceId of material.instance_ids) {
        layoutSequence += 1;
        const instancePlacements = result.placements.filter(
          (placement) => placement.source_id === instanceId,
        );
        const instanceAreas = result.areas.filter((area) => area.source_id === instanceId);
        const layout: CuttingLayout = {
          id: createId(),
          organization_id: job.organization_id,
          cutting_job_id: jobId,
          sequence_number: layoutSequence,
          material_type: isSheet ? "sheet" : "remnant",
          source_id: baseId,
          source_instance_id: instanceId,
          inventory_sheet_id: inventorySheetId,
          remnant_id: remnantId,
          width_mm: material.width_mm,
          height_mm: material.height_mm,
          utilization_percent: result.utilization_percent,
          waste_percent: result.waste_percent,
          geometry_json: {
            placements: instancePlacements,
            areas: instanceAreas,
            material: request.material,
          },
          score: result.score,
          is_selected: layoutSequence === 1,
          optimizer_version: result.optimizer_version,
          configuration_version: result.configuration_version,
          created_at: timestamp,
        };
        this.data.layouts.push(layout);
        instanceToLayout.set(instanceId, layout);
      }
    }

    for (const operation of result.operations) {
      const layout = instanceToLayout.get(operation.source_id);
      if (!layout) continue;
      const layoutOperations = this.data.operations.filter(
        (item) => item.cutting_layout_id === layout.id,
      );
      this.data.operations.push({
        id: createId(),
        organization_id: job.organization_id,
        cutting_job_id: jobId,
        cutting_layout_id: layout.id,
        sequence_number: layoutOperations.length + 1,
        operation_type: "cut",
        target_area_id: operation.area_id,
        target_piece_id:
          result.placements.find(
            (placement) =>
              placement.source_id === operation.source_id &&
              placement.y_mm === operation.position_mm &&
              placement.x_mm === operation.position_mm,
          )?.piece_id ?? null,
        axis: operation.axis,
        position_mm: operation.position_mm,
        cut_length_mm: operation.length_mm,
        instruction: operation.instruction,
        status: "pending",
        completed_at: null,
        completed_by: null,
      });
    }

    for (const placement of result.placements) {
      const piece = this.data.pieces.find((item) => item.id === placement.piece_id);
      if (!piece) continue;
      const layout = instanceToLayout.get(placement.source_id);
      piece.status = "assigned";
      piece.cutting_job_id = jobId;
      piece.geometry_json = {
        type: "rectangle",
        width_mm: placement.width_mm,
        height_mm: placement.height_mm,
        x_mm: placement.x_mm,
        y_mm: placement.y_mm,
        rotation_deg: placement.rotation_deg,
        layout_id: layout?.id ?? null,
      };
    }

    for (const material of result.materials) {
      const baseId = material.source_id;
      for (const instanceId of material.instance_ids) {
        if (material.kind === "sheet") {
          const inventorySheetId = baseId.replace(/^inv-/, "");
          const sheet = this.data.inventorySheets.find((item) => item.id === inventorySheetId);
          if (sheet && sheet.quantity > 0) {
            sheet.quantity -= 1;
            if (sheet.quantity <= 0) sheet.status = "depleted";
            sheet.updated_at = timestamp;
            this.data.movements.push({
              id: createId(),
              organization_id: job.organization_id,
              glass_product_id: sheet.glass_product_id,
              inventory_sheet_id: sheet.id,
              remnant_id: null,
              movement_type: "reservation",
              quantity: 1,
              unit_cost_cents: sheet.unit_cost_cents,
              reference_type: "cutting_job",
              reference_id: jobId,
              notes: instanceId,
              created_by: userId,
              created_at: timestamp,
            });
          }
        } else {
          const remnantId = baseId.replace(/^rem-/, "");
          try {
            this.reserveRemnantInternal(remnantId, jobId, userId);
          } catch (error) {
            if (error instanceof AppError) {
              this.releaseJobReservations(jobId, userId);
              throw error;
            }
            throw error;
          }
        }
      }
    }

    this.audit(userId, "cutting_job", jobId, "create", null, {
      utilization: result.utilization_percent,
      layouts: layoutSequence,
    });

    return job;
  }

  private releaseJobReservations(jobId: string, userId: string): void {
    for (const reservation of this.data.reservations) {
      if (reservation.cutting_job_id === jobId && reservation.status === "active") {
        this.releaseReservation(reservation);
      }
    }
    this.audit(userId, "cutting_job", jobId, "release_reservations", null, null);
  }

  startJob(id: string, userId: string): CuttingJob {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) throw new AppError("JOB_NOT_FOUND", "El trabajo no existe.");
    if (job.status !== "ready" && job.status !== "optimized") {
      throw new AppError("JOB_NOT_READY", "El trabajo no esta listo para iniciar.");
    }
    job.status = "in_progress";
    job.started_at = nowIso();
    for (const link of this.data.jobOrders.filter((item) => item.cutting_job_id === id)) {
      const order = this.data.orders.find((item) => item.id === link.order_id);
      if (order && (order.status === "queued" || order.status === "pending")) {
        order.status = "in_progress";
        order.updated_at = nowIso();
      }
    }
    this.audit(userId, "cutting_job", id, "start", null, null);
    return job;
  }

  markJobReady(id: string, userId: string): CuttingJob {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) throw new AppError("JOB_NOT_FOUND", "El trabajo no existe.");
    if (job.status !== "optimized") {
      throw new AppError("JOB_INVALID_STATE", "El trabajo no se encuentra optimizado.");
    }
    job.status = "ready";
    this.audit(userId, "cutting_job", id, "ready", null, null);
    return job;
  }

  completeOperation(jobId: string, operationId: string, userId: string): CuttingOperation {
    const operation = this.data.operations.find((item) => item.id === operationId);
    if (!operation || operation.cutting_job_id !== jobId) {
      throw new AppError("OPERATION_NOT_FOUND", "La operacion no existe.");
    }
    operation.status = "completed";
    operation.completed_at = nowIso();
    operation.completed_by = userId;
    this.audit(userId, "operation", operationId, "complete", null, null);
    return operation;
  }

  pauseJob(id: string, userId: string): CuttingJob {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) throw new AppError("JOB_NOT_FOUND", "El trabajo no existe.");
    if (job.status !== "in_progress") {
      throw new AppError("JOB_INVALID_STATE", "Solo un trabajo en corte puede pausarse.");
    }
    job.status = "ready";
    this.audit(userId, "cutting_job", id, "pause", null, null);
    return job;
  }

  completeJob(
    id: string,
    userId: string,
    remnantsInput: {
      glass_product_id: string;
      width_mm: number;
      height_mm: number;
      quantity: number;
      location: string | null;
    }[],
  ): CuttingJob {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) throw new AppError("JOB_NOT_FOUND", "El trabajo no existe.");
    if (job.status !== "in_progress" && job.status !== "ready") {
      throw new AppError("JOB_INVALID_STATE", "El trabajo no puede finalizarse en su estado actual.");
    }
    const pendingOperations = this.data.operations.filter(
      (operation) => operation.cutting_job_id === id && operation.status !== "completed",
    );
    if (pendingOperations.length > 0) {
      throw new AppError(
        "PENDING_OPERATIONS",
        "Existen operaciones pendientes. Un supervisor puede forzar la finalizacion.",
      );
    }
    const timestamp = nowIso();
    job.status = "completed";
    job.completed_at = timestamp;
    job.completed_by = userId;

    for (const reservation of this.data.reservations) {
      if (reservation.cutting_job_id === id && reservation.status === "active") {
        reservation.status = "consumed";
        reservation.updated_at = timestamp;
        this.data.movements.push({
          id: createId(),
          organization_id: job.organization_id,
          glass_product_id: this.data.remnants.find((item) => item.id === reservation.remnant_id)
            ?.glass_product_id ?? "",
          inventory_sheet_id: null,
          remnant_id: reservation.remnant_id,
          movement_type: "consumption",
          quantity: reservation.quantity,
          unit_cost_cents: null,
          reference_type: "cutting_job",
          reference_id: id,
          notes: null,
          created_by: userId,
          created_at: timestamp,
        });
      }
    }

    for (const remnant of remnantsInput) {
      this.createRemnant(
        {
          glass_product_id: remnant.glass_product_id,
          width_mm: remnant.width_mm,
          height_mm: remnant.height_mm,
          quantity: remnant.quantity,
          location: remnant.location,
          notes: `Generado por ${job.job_number}`,
          source_cutting_job_id: id,
        },
        userId,
      );
    }

    const jobPieces = this.data.pieces.filter((piece) => piece.cutting_job_id === id);
    for (const piece of jobPieces) {
      piece.status = "cut";
      piece.cut_at = timestamp;
    }

    for (const link of this.data.jobOrders.filter((item) => item.cutting_job_id === id)) {
      const orderPieces = this.data.pieces.filter((piece) => piece.order_id === link.order_id);
      const allCut = orderPieces.every((piece) => piece.status === "cut");
      const order = this.data.orders.find((item) => item.id === link.order_id);
      if (order && allCut) {
        order.status = "completed";
        order.completed_at = timestamp;
        order.updated_at = timestamp;
      }
    }

    this.audit(userId, "cutting_job", id, "complete", null, null);
    return job;
  }

  forceCompleteJob(id: string, userId: string): CuttingJob {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) throw new AppError("JOB_NOT_FOUND", "El trabajo no existe.");
    const timestamp = nowIso();
    for (const operation of this.data.operations.filter(
      (item) => item.cutting_job_id === id && item.status !== "completed",
    )) {
      operation.status = "skipped";
      operation.completed_at = timestamp;
      operation.completed_by = userId;
    }
    job.status = "completed";
    job.completed_at = timestamp;
    job.completed_by = userId;
    for (const piece of this.data.pieces.filter((item) => item.cutting_job_id === id)) {
      piece.status = "cut";
      piece.cut_at = timestamp;
    }
    for (const link of this.data.jobOrders.filter((item) => item.cutting_job_id === id)) {
      const order = this.data.orders.find((item) => item.id === link.order_id);
      if (order) {
        order.status = "completed";
        order.completed_at = timestamp;
        order.updated_at = timestamp;
      }
    }
    this.audit(userId, "cutting_job", id, "force_complete", null, null);
    return job;
  }

  cancelJob(id: string, userId: string): CuttingJob {
    const job = this.data.jobs.find((item) => item.id === id);
    if (!job) throw new AppError("JOB_NOT_FOUND", "El trabajo no existe.");
    if (job.status === "completed") {
      throw new AppError("JOB_COMPLETED", "Un trabajo completado no puede cancelarse.");
    }
    const timestamp = nowIso();
    for (const reservation of this.data.reservations) {
      if (reservation.cutting_job_id === id && reservation.status === "active") {
        this.releaseReservation(reservation);
      }
    }
    for (const movement of this.data.movements) {
      if (
        movement.reference_type === "cutting_job" &&
        movement.reference_id === id &&
        movement.movement_type === "reservation" &&
        movement.inventory_sheet_id
      ) {
        const sheet = this.data.inventorySheets.find(
          (item) => item.id === movement.inventory_sheet_id,
        );
        if (sheet) {
          sheet.quantity += movement.quantity;
          if (sheet.quantity > 0) sheet.status = "available";
          sheet.updated_at = timestamp;
        }
      }
    }
    for (const piece of this.data.pieces.filter((item) => item.cutting_job_id === id)) {
      piece.status = "pending";
      piece.cutting_job_id = null;
      piece.geometry_json = {
        type: "rectangle",
        width_mm: piece.requested_width_mm,
        height_mm: piece.requested_height_mm,
      };
    }
    job.status = "cancelled";
    this.audit(userId, "cutting_job", id, "cancel", null, null);
    return job;
  }

  getDashboard(): DashboardData {
    const orders = this.data.orders;
    const jobs = this.data.jobs;
    const completed = jobs.filter((job) => job.status === "completed");
    const averageUtilization =
      completed.length > 0
        ? completed.reduce((sum, job) => sum + job.utilization_percent, 0) / completed.length
        : 0;
    const wastePercent =
      completed.length > 0
        ? completed.reduce((sum, job) => sum + job.waste_percent, 0) / completed.length
        : 0;
    return {
      pendingOrders: orders.filter((order) => ["draft", "pending", "queued"].includes(order.status)).length,
      jobsInProgress: jobs.filter((job) => job.status === "in_progress").length,
      completedJobs: completed.length,
      availableRemnants: this.data.remnants.filter((remnant) => remnant.status === "available").length,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      wastePercent: Math.round(wastePercent * 100) / 100,
      recentJobs: [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
      lowStock: this.listInventorySheets()
        .filter((sheet) => sheet.status === "available" && sheet.quantity <= 3)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5),
    };
  }

  listMovements(limit = 100) {
    return [...this.data.movements]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  listAuditLogs(limit = 100) {
    return [...this.data.auditLogs]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  listReservations(jobId?: string): MaterialReservation[] {
    return this.data.reservations.filter(
      (reservation) => (jobId ? reservation.cutting_job_id === jobId : true) && reservation.status === "active",
    );
  }
}

export type { Role };
