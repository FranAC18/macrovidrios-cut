import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Inbox, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PageHeader({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {action}
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          tone === "success" && "text-emerald-700",
          tone === "warning" && "text-amber-700",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      ) : null}
    </Card>
  );
}

export function ErrorState({
  title = "No pudimos cargar la informacion",
  description = "Revisa tu conexion e intentalo nuevamente.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 border-destructive/40 p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

export function NoPermissionState() {
  return (
    <Card className="flex flex-col items-center gap-2 p-10 text-center">
      <Lock className="h-6 w-6 text-muted-foreground" />
      <p className="font-semibold">Sin permisos</p>
      <p className="text-sm text-muted-foreground">
        Tu rol no tiene acceso a esta seccion. Solicita acceso a un administrador.
      </p>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
