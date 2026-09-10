"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { orderSchema } from "@/lib/validation/schemas";
import { toUserMessage } from "@/lib/errors";
import type { OrderStatus } from "@/types/domain";

export interface OrderActionState {
  error?: string;
  ok?: boolean;
  orderId?: string;
}

export async function createOrderAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const user = await requirePermission("orders.manage");
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items_json") ?? "[]"));
  } catch {
    return { error: "No pudimos leer las piezas del pedido." };
  }
  const parsed = orderSchema.safeParse({
    customer_id: formData.get("customer_id") || null,
    due_at: formData.get("due_at") || undefined,
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
    discount_cents: Math.round(Number(formData.get("discount") || 0) * 100),
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del pedido." };
  }
  try {
    const order = getRepository().createOrder(
      {
        customer_id: parsed.data.customer_id ?? null,
        due_at: parsed.data.due_at ?? null,
        reference: parsed.data.reference ?? null,
        notes: parsed.data.notes ?? null,
        discount_cents: parsed.data.discount_cents,
        items: parsed.data.items.map((item) => ({
          glass_product_id: item.glass_product_id,
          name: item.name ?? null,
          quantity: item.quantity,
          width_mm: item.width_mm,
          height_mm: item.height_mm,
          rotatable: item.rotatable,
          notes: item.notes ?? null,
        })),
      },
      user.id,
    );
    revalidatePath("/pedidos");
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function transitionOrderAction(formData: FormData): Promise<void> {
  const user = await requirePermission("orders.manage");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  getRepository().transitionOrder(id, status, user.id);
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
}
