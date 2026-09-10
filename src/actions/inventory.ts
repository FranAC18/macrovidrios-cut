"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { remnantSchema } from "@/lib/validation/schemas";
import { toUserMessage } from "@/lib/errors";

export interface RemnantActionState {
  error?: string;
  ok?: boolean;
}

export async function createRemnantAction(
  _prev: RemnantActionState,
  formData: FormData,
): Promise<RemnantActionState> {
  const user = await requirePermission("inventory.manage");
  const parsed = remnantSchema.safeParse({
    glass_product_id: formData.get("glass_product_id"),
    width_mm: formData.get("width_mm"),
    height_mm: formData.get("height_mm"),
    quantity: formData.get("quantity"),
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    getRepository().createRemnant(
      {
        glass_product_id: parsed.data.glass_product_id,
        width_mm: parsed.data.width_mm,
        height_mm: parsed.data.height_mm,
        quantity: parsed.data.quantity,
        location: parsed.data.location,
        notes: parsed.data.notes,
      },
      user.id,
    );
    revalidatePath("/retazos");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function discardRemnantAction(formData: FormData): Promise<void> {
  const user = await requirePermission("inventory.manage");
  const id = String(formData.get("id"));
  getRepository().discardRemnant(id, user.id);
  revalidatePath("/retazos");
}
