import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => (value && value.length > 0 ? value : null));

export const customerSchema = z.object({
  full_name: z.string().trim().min(2, "El nombre es obligatorio.").max(200),
  identification_number: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  email: z
    .string()
    .trim()
    .email("Correo invalido.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value && value.length > 0 ? value : null)),
  address: optionalText,
  notes: optionalText,
  active: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const orderItemSchema = z.object({
  glass_product_id: z.string().uuid("Selecciona un material valido."),
  name: optionalText,
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1.").max(9999),
  width_mm: z.coerce.number().int().min(10, "El ancho minimo es 10 mm.").max(20000),
  height_mm: z.coerce.number().int().min(10, "El alto minimo es 10 mm.").max(20000),
  rotatable: z.boolean().default(true),
  notes: optionalText,
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  due_at: optionalText,
  reference: optionalText,
  notes: optionalText,
  discount_cents: z.coerce.number().int().min(0).default(0),
  items: z.array(orderItemSchema).min(1, "Agrega al menos una pieza."),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const glassColorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(1).max(20),
  display_order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const glassThicknessSchema = z.object({
  thickness_mm: z.coerce.number().int().min(1).max(100),
  active: z.boolean().default(true),
});

export const glassProductSchema = z.object({
  color_id: z.string().uuid(),
  thickness_id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  internal_code: z.string().trim().min(1).max(40),
  default_kerf_mm: z.coerce.number().int().min(0).max(50).default(3),
  default_margin_mm: z.coerce.number().int().min(0).max(200).default(10),
  default_separation_mm: z.coerce.number().int().min(0).max(200).default(0),
  active: z.boolean().default(true),
});

export const sheetTypeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  width_mm: z.coerce.number().int().min(100).max(20000),
  height_mm: z.coerce.number().int().min(100).max(20000),
  default_cost_cents: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
});

export const inventorySheetSchema = z.object({
  sheet_type_id: z.string().uuid(),
  glass_product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(100000),
  unit_cost_cents: z.coerce.number().int().min(0),
  location: optionalText,
  batch_reference: optionalText,
});

export const remnantSchema = z.object({
  glass_product_id: z.string().uuid(),
  width_mm: z.coerce.number().int().min(20).max(20000),
  height_mm: z.coerce.number().int().min(20).max(20000),
  quantity: z.coerce.number().int().min(1).max(1000),
  location: optionalText,
  notes: optionalText,
});

export const cuttingRequestSchema = z.object({
  strategy: z.enum(["sheets", "remnants", "mixed"]),
  allow_rotation: z.boolean().default(true),
  order_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos un pedido."),
  piece_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos una pieza."),
  sheet_type_ids: z.array(z.string().uuid()).default([]),
  remnant_ids: z.array(z.string().uuid()).default([]),
  notes: optionalText,
});

export type CuttingRequestInput = z.infer<typeof cuttingRequestSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Correo invalido."),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
});

export type LoginInput = z.infer<typeof loginSchema>;
