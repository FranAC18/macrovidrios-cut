import type { Role } from "@/types/domain";

export type Permission =
  | "customers.manage"
  | "orders.manage"
  | "catalog.manage"
  | "catalog.view"
  | "inventory.manage"
  | "inventory.view"
  | "cutting.create"
  | "cutting.produce"
  | "cutting.reopen"
  | "jobs.force_complete"
  | "reports.view"
  | "config.manage"
  | "users.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "customers.manage",
    "orders.manage",
    "catalog.manage",
    "catalog.view",
    "inventory.manage",
    "inventory.view",
    "cutting.create",
    "cutting.produce",
    "cutting.reopen",
    "jobs.force_complete",
    "reports.view",
    "config.manage",
    "users.manage",
  ],
  supervisor: [
    "customers.manage",
    "orders.manage",
    "catalog.manage",
    "catalog.view",
    "inventory.manage",
    "inventory.view",
    "cutting.create",
    "cutting.produce",
    "cutting.reopen",
    "jobs.force_complete",
    "reports.view",
    "config.manage",
  ],
  vendedor: ["customers.manage", "orders.manage", "catalog.view", "inventory.view", "reports.view"],
  cortador: ["catalog.view", "inventory.view", "cutting.produce"],
};

export function rolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions(role).includes(permission);
}

export function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    admin: "Administrador",
    supervisor: "Supervisor",
    vendedor: "Vendedor",
    cortador: "Cortador",
  };
  return labels[role];
}
