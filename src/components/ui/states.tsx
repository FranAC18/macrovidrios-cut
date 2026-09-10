import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Inbox, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
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
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
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
    <div className="panel flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-full bg-accent p-3 text-accent-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display font-bold">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      ) : null}
    </div>
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
    <div className="panel flex flex-col items-center gap-2 border-destructive/30 p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="font-display font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function NoPermissionState() {
  return (
    <div className="panel flex flex-col items-center gap-2 p-10 text-center">
      <Lock className="h-6 w-6 text-muted-foreground" />
      <p className="font-display font-bold">Sin permisos</p>
      <p className="text-sm text-muted-foreground">
        Tu rol no tiene acceso a esta seccion. Solicita acceso a un administrador.
      </p>
    </div>
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
