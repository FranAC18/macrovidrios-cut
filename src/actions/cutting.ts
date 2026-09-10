"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { cuttingRequestSchema } from "@/lib/validation/schemas";
import { toUserMessage } from "@/lib/errors";

export interface CuttingActionState {
  error?: string;
  ok?: boolean;
}

export async function createJobAction(
  _prev: CuttingActionState,
  formData: FormData,
): Promise<CuttingActionState> {
  const user = await requirePermission("cutting.create");
  let payload: unknown = {};
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "No pudimos leer la configuracion del cuadre." };
  }
  const parsed = cuttingRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa la configuracion del cuadre." };
  }
  let jobId: string;
  try {
    const job = getRepository().createJob(
      {
        strategy: parsed.data.strategy,
        allow_rotation: parsed.data.allow_rotation,
        order_ids: parsed.data.order_ids,
        piece_ids: parsed.data.piece_ids,
        sheet_type_ids: parsed.data.sheet_type_ids,
        remnant_ids: parsed.data.remnant_ids,
        notes: parsed.data.notes,
      },
      user.id,
    );
    jobId = job.id;
  } catch (error) {
    return { error: toUserMessage(error) };
  }
  revalidatePath("/cuadres");
  redirect(`/cuadres/${jobId}`);
}

export async function markReadyAction(formData: FormData): Promise<void> {
  const user = await requirePermission("cutting.create");
  const id = String(formData.get("id"));
  getRepository().markJobReady(id, user.id);
  revalidatePath(`/cuadres/${id}`);
}

export async function startJobAction(formData: FormData): Promise<void> {
  const user = await requirePermission("cutting.produce");
  const id = String(formData.get("id"));
  getRepository().startJob(id, user.id);
  revalidatePath(`/produccion/${id}`);
  revalidatePath("/produccion");
  redirect(`/produccion/${id}`);
}

export async function pauseJobAction(formData: FormData): Promise<void> {
  const user = await requirePermission("cutting.produce");
  const id = String(formData.get("id"));
  getRepository().pauseJob(id, user.id);
  revalidatePath(`/produccion/${id}`);
  revalidatePath("/produccion");
}

export async function completeOperationAction(formData: FormData): Promise<void> {
  const user = await requirePermission("cutting.produce");
  const jobId = String(formData.get("jobId"));
  const operationId = String(formData.get("operationId"));
  getRepository().completeOperation(jobId, operationId, user.id);
  revalidatePath(`/produccion/${jobId}`);
}

export async function completeJobAction(formData: FormData): Promise<void> {
  const user = await requirePermission("cutting.produce");
  const id = String(formData.get("id"));
  let remnants: unknown = [];
  try {
    remnants = JSON.parse(String(formData.get("remnants_json") ?? "[]"));
  } catch {
    remnants = [];
  }
  const repo = getRepository();
  repo.completeJob(
    id,
    user.id,
    Array.isArray(remnants)
      ? (remnants as {
          glass_product_id: string;
          width_mm: number;
          height_mm: number;
          quantity: number;
          location: string | null;
        }[])
      : [],
  );
  revalidatePath("/produccion");
  revalidatePath("/historial");
  redirect("/produccion");
}

export async function forceCompleteJobAction(formData: FormData): Promise<void> {
  const user = await requirePermission("jobs.force_complete");
  const id = String(formData.get("id"));
  getRepository().forceCompleteJob(id, user.id);
  revalidatePath("/produccion");
  redirect("/produccion");
}

export async function cancelJobAction(formData: FormData): Promise<void> {
  const user = await requirePermission("cutting.create");
  const id = String(formData.get("id"));
  getRepository().cancelJob(id, user.id);
  revalidatePath("/cuadres");
  redirect("/cuadres");
}
