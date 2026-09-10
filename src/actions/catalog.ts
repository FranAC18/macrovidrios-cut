"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import {
  glassColorSchema,
  glassProductSchema,
  glassThicknessSchema,
  inventorySheetSchema,
  sheetTypeSchema,
} from "@/lib/validation/schemas";
import { toUserMessage } from "@/lib/errors";

export interface CatalogActionState {
  error?: string;
  ok?: boolean;
}

export async function createColorAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const user = await requirePermission("catalog.manage");
  const parsed = glassColorSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    display_order: formData.get("display_order") || 0,
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    getRepository().createColor(parsed.data, user.id);
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function createThicknessAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const user = await requirePermission("catalog.manage");
  const parsed = glassThicknessSchema.safeParse({
    thickness_mm: formData.get("thickness_mm"),
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    getRepository().createThickness(parsed.data, user.id);
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function createProductAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const user = await requirePermission("catalog.manage");
  const parsed = glassProductSchema.safeParse({
    color_id: formData.get("color_id"),
    thickness_id: formData.get("thickness_id"),
    name: formData.get("name"),
    internal_code: formData.get("internal_code"),
    default_kerf_mm: formData.get("default_kerf_mm") || 3,
    default_margin_mm: formData.get("default_margin_mm") || 10,
    default_separation_mm: formData.get("default_separation_mm") || 0,
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    getRepository().createProduct(parsed.data, user.id);
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function createSheetTypeAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const user = await requirePermission("catalog.manage");
  const parsed = sheetTypeSchema.safeParse({
    name: formData.get("name"),
    width_mm: formData.get("width_mm"),
    height_mm: formData.get("height_mm"),
    default_cost_cents: Math.round(Number(formData.get("default_cost") || 0) * 100),
    active: true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    getRepository().createSheetType(parsed.data, user.id);
    revalidatePath("/planchas");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function createInventorySheetAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const user = await requirePermission("inventory.manage");
  const parsed = inventorySheetSchema.safeParse({
    sheet_type_id: formData.get("sheet_type_id"),
    glass_product_id: formData.get("glass_product_id"),
    quantity: formData.get("quantity"),
    unit_cost_cents: Math.round(Number(formData.get("unit_cost") || 0) * 100),
    location: formData.get("location") || undefined,
    batch_reference: undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    getRepository().createInventorySheet(
      { ...parsed.data, batch_reference: null },
      user.id,
    );
    revalidatePath("/planchas");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}
