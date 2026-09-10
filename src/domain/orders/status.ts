import type { JobStatus, OrderStatus } from "@/types/domain";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending", "cancelled"],
  pending: ["draft", "queued", "cancelled"],
  queued: ["pending", "in_progress", "cancelled"],
  in_progress: ["queued", "completed"],
  completed: [],
  cancelled: [],
};

const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["optimizing", "cancelled"],
  optimizing: ["optimized", "draft", "cancelled"],
  optimized: ["ready", "optimizing", "cancelled"],
  ready: ["in_progress", "optimized", "cancelled"],
  in_progress: ["completed", "ready"],
  completed: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Transicion de pedido no permitida: ${from} -> ${to}.`);
  }
}

export function canTransitionJob(from: JobStatus, to: JobStatus): boolean {
  return JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertJobTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransitionJob(from, to)) {
    throw new Error(`Transicion de trabajo no permitida: ${from} -> ${to}.`);
  }
}

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    draft: "Borrador",
    pending: "Pendiente",
    queued: "En cola",
    in_progress: "En corte",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  return labels[status];
}

export function jobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    draft: "Borrador",
    optimizing: "Optimizando",
    optimized: "Optimizado",
    ready: "Listo para cortar",
    in_progress: "En corte",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  return labels[status];
}

export function operationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En curso",
    completed: "Realizado",
    skipped: "Omitido",
    issue: "Con problema",
  };
  return labels[status] ?? status;
}
