"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { customerSchema } from "@/lib/validation/schemas";
import { toUserMessage } from "@/lib/errors";

export interface CustomerActionState {
  error?: string;
  ok?: boolean;
}

export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const user = await requirePermission("customers.manage");
  const parsed = customerSchema.safeParse({
    full_name: formData.get("full_name"),
    identification_number: formData.get("identification_number") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || "",
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    active: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del cliente." };
  }
  try {
    getRepository().createCustomer(parsed.data, user.id);
    revalidatePath("/clientes");
    return { ok: true };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

export async function archiveCustomerAction(formData: FormData): Promise<void> {
  const user = await requirePermission("customers.manage");
  const id = String(formData.get("id"));
  getRepository().archiveCustomer(id, user.id);
  revalidatePath("/clientes");
}

export interface QuickCustomerResult {
  ok?: boolean;
  error?: string;
  customer?: { id: string; full_name: string };
}

export async function createCustomerQuickAction(input: {
  full_name: string;
  phone?: string;
}): Promise<QuickCustomerResult> {
  const user = await requirePermission("customers.manage");
  const name = input.full_name?.trim() ?? "";
  if (name.length < 2) {
    return { error: "El nombre del cliente es obligatorio." };
  }
  try {
    const customer = getRepository().createCustomer(
      {
        full_name: name,
        identification_number: null,
        phone: input.phone?.trim() || null,
        whatsapp: null,
        email: null,
        address: null,
        notes: null,
        active: true,
      },
      user.id,
    );
    revalidatePath("/clientes");
    return { ok: true, customer: { id: customer.id, full_name: customer.full_name } };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}
