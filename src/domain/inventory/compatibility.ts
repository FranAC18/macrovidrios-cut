import type { GlassProduct, InventorySheet, Remnant } from "@/types/domain";

export function isCompatibleMaterial(
  a: { glass_product_id: string },
  b: { glass_product_id: string },
): boolean {
  return a.glass_product_id === b.glass_product_id;
}

export function remnantFits(
  remnant: Pick<Remnant, "width_mm" | "height_mm">,
  width: number,
  height: number,
  allowRotation: boolean,
): boolean {
  if (width <= remnant.width_mm && height <= remnant.height_mm) return true;
  if (allowRotation && height <= remnant.width_mm && width <= remnant.height_mm) return true;
  return false;
}

export function availableSheetQuantity(sheet: Pick<InventorySheet, "quantity" | "status">): number {
  return sheet.status === "available" ? Math.max(0, sheet.quantity) : 0;
}

export function productLabel(
  product: Pick<GlassProduct, "name">,
  colorName?: string,
  thicknessMm?: number,
): string {
  if (colorName && thicknessMm) return `${colorName} ${thicknessMm} mm`;
  return product.name;
}
