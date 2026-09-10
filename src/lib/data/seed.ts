import type { AppData, GlassProduct, Order, OrderItem, Piece } from "@/types/domain";
import { createId, nowIso } from "./id";

export const DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_PASSWORD = "macrovidrios";

export interface DemoUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "vendedor" | "cortador";
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    email: "admin@macrovidrios.com",
    full_name: "Administrador",
    role: "admin",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    email: "supervisor@macrovidrios.com",
    full_name: "Supervisor de planta",
    role: "supervisor",
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    email: "vendedor@macrovidrios.com",
    full_name: "Ventas",
    role: "vendedor",
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    email: "cortador@macrovidrios.com",
    full_name: "Operador de corte",
    role: "cortador",
  },
];

function buildProducts(orgId: string): {
  products: GlassProduct[];
  colorByCode: Record<string, string>;
} {
  const colorDefs = [
    { name: "Claro", code: "CLA", order: 1 },
    { name: "Bronce", code: "BRO", order: 2 },
    { name: "Verde", code: "VER", order: 3 },
    { name: "Negro", code: "NEG", order: 4 },
    { name: "Espejo", code: "ESP", order: 5 },
    { name: "Gris", code: "GRI", order: 6 },
    { name: "Azul", code: "AZU", order: 7 },
  ];
  const thicknesses = [3, 4, 5, 6, 8, 10];
  const products: GlassProduct[] = [];
  const colorByCode: Record<string, string> = {};
  colorDefs.forEach((color, colorIndex) => {
    colorByCode[color.code] = `00000000-0000-4000-8000-0000000002${(colorIndex + 1)
      .toString()
      .padStart(2, "0")}`;
    thicknesses.forEach((thickness, thicknessIndex) => {
      products.push({
        id: `00000000-0000-4000-8000-0000000003${(colorIndex * 10 + thicknessIndex + 1)
          .toString()
          .padStart(2, "0")}`,
        organization_id: orgId,
        color_id: colorByCode[color.code],
        thickness_id: `00000000-0000-4000-8000-0000000004${(thicknessIndex + 1)
          .toString()
          .padStart(2, "0")}`,
        internal_code: `${color.code}-${thickness}`,
        name: `${color.name} ${thickness} mm`,
        default_kerf_mm: 3,
        default_margin_mm: 10,
        default_separation_mm: 0,
        default_edge_margin_mm: null,
        active: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    });
  });
  return { products, colorByCode };
}

export function createSeedData(): AppData {
  const orgId = DEMO_ORGANIZATION_ID;
  const timestamp = nowIso();
  const { products } = buildProducts(orgId);

  const colors = [
    { name: "Claro", code: "CLA", order: 1 },
    { name: "Bronce", code: "BRO", order: 2 },
    { name: "Verde", code: "VER", order: 3 },
    { name: "Negro", code: "NEG", order: 4 },
    { name: "Espejo", code: "ESP", order: 5 },
    { name: "Gris", code: "GRI", order: 6 },
    { name: "Azul", code: "AZU", order: 7 },
  ].map((color, index) => ({
    id: `00000000-0000-4000-8000-0000000002${(index + 1).toString().padStart(2, "0")}`,
    organization_id: orgId,
    name: color.name,
    code: color.code,
    display_order: color.order,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const thicknesses = [3, 4, 5, 6, 8, 10].map((thickness, index) => ({
    id: `00000000-0000-4000-8000-0000000004${(index + 1).toString().padStart(2, "0")}`,
    organization_id: orgId,
    thickness_mm: thickness,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const claro6 = products.find((product) => product.internal_code === "CLA-6")!;
  const bronce6 = products.find((product) => product.internal_code === "BRO-6")!;
  const claro4 = products.find((product) => product.internal_code === "CLA-4")!;

  const sheetTypes = [
    {
      id: "00000000-0000-4000-8000-000000000501",
      name: "Plancha 3210 × 2140",
      width_mm: 3210,
      height_mm: 2140,
      default_cost_cents: 850000,
    },
    {
      id: "00000000-0000-4000-8000-000000000502",
      name: "Plancha 2440 × 1830",
      width_mm: 2440,
      height_mm: 1830,
      default_cost_cents: 620000,
    },
    {
      id: "00000000-0000-4000-8000-000000000503",
      name: "Plancha 3300 × 2140",
      width_mm: 3300,
      height_mm: 2140,
      default_cost_cents: 910000,
    },
  ].map((sheet) => ({
    ...sheet,
    organization_id: orgId,
    minimum_usable_area_mm2: null,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const inventorySheets = [
    {
      id: "00000000-0000-4000-8000-000000000601",
      sheet_type_id: "00000000-0000-4000-8000-000000000501",
      glass_product_id: claro6.id,
      quantity: 20,
      unit_cost_cents: 850000,
    },
    {
      id: "00000000-0000-4000-8000-000000000602",
      sheet_type_id: "00000000-0000-4000-8000-000000000501",
      glass_product_id: bronce6.id,
      quantity: 10,
      unit_cost_cents: 920000,
    },
    {
      id: "00000000-0000-4000-8000-000000000603",
      sheet_type_id: "00000000-0000-4000-8000-000000000502",
      glass_product_id: claro4.id,
      quantity: 12,
      unit_cost_cents: 540000,
    },
  ].map((sheet) => ({
    ...sheet,
    organization_id: orgId,
    status: "available" as const,
    location: "Bodega A",
    batch_reference: null,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const remnants = [
    {
      id: "00000000-0000-4000-8000-000000000701",
      glass_product_id: claro6.id,
      width_mm: 1200,
      height_mm: 750,
      location: "Bodega A",
    },
    {
      id: "00000000-0000-4000-8000-000000000702",
      glass_product_id: claro6.id,
      width_mm: 900,
      height_mm: 600,
      location: "Bodega A",
    },
    {
      id: "00000000-0000-4000-8000-000000000703",
      glass_product_id: bronce6.id,
      width_mm: 1500,
      height_mm: 800,
      location: "Bodega B",
    },
  ].map((remnant) => ({
    ...remnant,
    organization_id: orgId,
    shape_type: "rectangle" as const,
    geometry_json: null,
    quantity: 1,
    minimum_usable_flag: true,
    status: "available" as const,
    source_cutting_job_id: null,
    source_layout_id: null,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const customers = [
    {
      id: "00000000-0000-4000-8000-000000000801",
      full_name: "Constructora Andina",
      identification_number: "1790012345001",
      phone: "0991234567",
      whatsapp: "0991234567",
      email: "compras@andina.ec",
      address: "Av. Amazonas y Colon, Quito",
    },
    {
      id: "00000000-0000-4000-8000-000000000802",
      full_name: "Muebles del Valle",
      identification_number: null,
      phone: "0987654321",
      whatsapp: null,
      email: null,
      address: "Cumbaya",
    },
  ].map((customer) => ({
    ...customer,
    organization_id: orgId,
    notes: null,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const orderOneId = "00000000-0000-4000-8000-000000000901";
  const orderTwoId = "00000000-0000-4000-8000-000000000902";
  const orders: Order[] = [
    {
      id: orderOneId,
      organization_id: orgId,
      order_number: "MV-00231",
      customer_id: "00000000-0000-4000-8000-000000000801",
      status: "queued",
      requested_at: timestamp,
      due_at: null,
      reference: "Obra norte",
      notes: null,
      subtotal_cents: 0,
      discount_cents: 0,
      total_cents: 0,
      created_by: DEMO_USERS[0].id,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null,
    },
    {
      id: orderTwoId,
      organization_id: orgId,
      order_number: "MV-00234",
      customer_id: "00000000-0000-4000-8000-000000000802",
      status: "queued",
      requested_at: timestamp,
      due_at: null,
      reference: "Vitrinas",
      notes: null,
      subtotal_cents: 0,
      discount_cents: 0,
      total_cents: 0,
      created_by: DEMO_USERS[2].id,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null,
    },
  ];

  const orderItems: OrderItem[] = [
    {
      id: "00000000-0000-4000-8000-000000000a01",
      organization_id: orgId,
      order_id: orderOneId,
      glass_product_id: claro6.id,
      name: "Ventanal",
      piece_type: "rectangle",
      quantity: 2,
      width_mm: 1200,
      height_mm: 800,
      rotatable: true,
      geometry_json: null,
      notes: null,
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: "00000000-0000-4000-8000-000000000a02",
      organization_id: orgId,
      order_id: orderOneId,
      glass_product_id: claro6.id,
      name: "Puerta corredera",
      piece_type: "rectangle",
      quantity: 2,
      width_mm: 900,
      height_mm: 600,
      rotatable: true,
      geometry_json: null,
      notes: null,
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: "00000000-0000-4000-8000-000000000a03",
      organization_id: orgId,
      order_id: orderTwoId,
      glass_product_id: claro6.id,
      name: "Mampara",
      piece_type: "rectangle",
      quantity: 2,
      width_mm: 1000,
      height_mm: 500,
      rotatable: true,
      geometry_json: null,
      notes: null,
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      id: "00000000-0000-4000-8000-000000000a04",
      organization_id: orgId,
      order_id: orderTwoId,
      glass_product_id: claro6.id,
      name: "Repisa",
      piece_type: "rectangle",
      quantity: 3,
      width_mm: 600,
      height_mm: 400,
      rotatable: true,
      geometry_json: null,
      notes: null,
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    },
  ];

  const pieces: Piece[] = [];
  let sequence = 0;
  for (const item of orderItems) {
    for (let index = 0; index < item.quantity; index += 1) {
      sequence += 1;
      pieces.push({
        id: createId(),
        organization_id: orgId,
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
        created_at: timestamp,
      });
    }
  }

  const services = [
    { name: "Corte", unit_type: "per_cut" as const, unit_price_cents: 150 },
    { name: "Pulido", unit_type: "per_linear_meter" as const, unit_price_cents: 350 },
    { name: "Perforacion", unit_type: "per_piece" as const, unit_price_cents: 500 },
    { name: "Biselado", unit_type: "per_linear_meter" as const, unit_price_cents: 700 },
    { name: "Transporte", unit_type: "fixed" as const, unit_price_cents: 2500 },
    { name: "Instalacion", unit_type: "fixed" as const, unit_price_cents: 5000 },
  ].map((service, index) => ({
    id: `00000000-0000-4000-8000-000000000b${(index + 1).toString().padStart(2, "0")}`,
    organization_id: orgId,
    name: service.name,
    unit_type: service.unit_type,
    unit_price_cents: service.unit_price_cents,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const pricingRules = [
    {
      id: "00000000-0000-4000-8000-000000000c01",
      name: "Precio material por m²",
      rule_type: "per_square_meter" as const,
      parameter_json: { price_per_m2_cents: 4500 },
      priority: 1,
    },
    {
      id: "00000000-0000-4000-8000-000000000c02",
      name: "Corte por pieza",
      rule_type: "per_piece" as const,
      parameter_json: { price_per_piece_cents: 350 },
      priority: 2,
    },
  ].map((rule) => ({
    ...rule,
    organization_id: orgId,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  return {
    organizations: [{ id: orgId, name: "MacroVidrios", created_at: timestamp }],
    profiles: DEMO_USERS.map((user) => ({
      id: user.id,
      organization_id: orgId,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    })),
    customers,
    colors,
    thicknesses,
    products,
    sheetTypes,
    inventorySheets,
    remnants,
    orders,
    orderItems,
    pieces,
    jobs: [],
    jobOrders: [],
    layouts: [],
    operations: [],
    movements: [],
    reservations: [],
    auditLogs: [],
    services,
    pricingRules,
  };
}
