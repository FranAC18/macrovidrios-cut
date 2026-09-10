import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play, Scissors, Trash2 } from "lucide-react";
import { cancelJobAction, markReadyAction, startJobAction } from "@/actions/cutting";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatAreaFromMm2, formatDate, formatMoney, formatPercent } from "@/lib/format";
import { jobStatusLabel, operationStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutViewer, type LayoutPlacementView } from "@/components/cutting/layout-viewer";
import { PageHeader, StatCard } from "@/components/ui/states";
import type { CuttingArea, MaterialSpec, Placement } from "@/lib/optimization/types";

export const metadata = { title: "Detalle de cuadre" };

interface LayoutGeometry {
  placements?: Placement[];
  areas?: CuttingArea[];
  material?: MaterialSpec;
}

export default async function CuttingJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("cutting.create");
  const { id } = await params;
  const repo = getRepository();
  const detail = repo.getJobDetail(id);
  if (!detail) notFound();

  const { job, orders, layouts, operations, pieces } = detail;
  const pieceCodeById = new Map(pieces.map((piece) => [piece.id, piece.piece_code] as const));
  const canManage = user.role === "admin" || user.role === "supervisor";

  return (
    <div>
      <Link href="/cuadres" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver a cuadres
      </Link>
      <PageHeader
        title={job.job_number}
        description={`${orders.map((order) => order.order_number).join(", ") || "Sin pedidos"} · ${formatDate(job.created_at)}`}
      >
        <Badge variant={job.status === "completed" ? "success" : "info"}>{jobStatusLabel(job.status)}</Badge>
        {job.status === "optimized" ? (
          <form action={markReadyAction}>
            <input type="hidden" name="id" value={job.id} />
            <Button type="submit" variant="outline">
              Marcar listo
            </Button>
          </form>
        ) : null}
        {job.status === "ready" || job.status === "optimized" ? (
          <form action={startJobAction}>
            <input type="hidden" name="id" value={job.id} />
            <Button type="submit">
              <Play className="h-4 w-4" />
              Iniciar corte
            </Button>
          </form>
        ) : null}
        {job.status === "in_progress" ? (
          <Link href={`/produccion/${job.id}`} className={buttonVariants()}>
            <Scissors className="h-4 w-4" />
            Ir a produccion
          </Link>
        ) : null}
        {job.status !== "completed" && job.status !== "cancelled" && canManage ? (
          <form action={cancelJobAction}>
            <input type="hidden" name="id" value={job.id} />
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Cancelar
            </Button>
          </form>
        ) : null}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aprovechamiento" value={formatPercent(job.utilization_percent)} tone="success" />
        <StatCard label="Desperdicio" value={formatPercent(job.waste_percent)} tone="warning" />
        <StatCard label="Area usada" value={formatAreaFromMm2(job.total_used_area_mm2)} />
        <StatCard label="Costo material" value={formatMoney(job.total_material_cost_cents)} />
      </div>

      <div className="mt-6 space-y-6">
        {layouts.map((layout) => {
          const geometry = (layout.geometry_json ?? {}) as LayoutGeometry;
          const placements: LayoutPlacementView[] = (geometry.placements ?? []).map((placement) => ({
            piece_id: placement.piece_id,
            piece_code: pieceCodeById.get(placement.piece_id),
            x_mm: placement.x_mm,
            y_mm: placement.y_mm,
            width_mm: placement.width_mm,
            height_mm: placement.height_mm,
            rotation_deg: placement.rotation_deg,
          }));
          const layoutOperations = operations.filter(
            (operation) => operation.cutting_layout_id === layout.id,
          );
          return (
            <Card key={layout.id}>
              <CardHeader>
                <CardTitle>
                  Fuente {layout.sequence_number} · {layout.material_type === "sheet" ? "Plancha" : "Retazo"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <LayoutViewer
                  widthMm={layout.width_mm}
                  heightMm={layout.height_mm}
                  placements={placements}
                  utilizationPercent={layout.utilization_percent}
                />
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Secuencia de corte</h3>
                  <ol className="space-y-2">
                    {layoutOperations.map((operation) => (
                      <li
                        key={operation.id}
                        className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                      >
                        <span>
                          <span className="mr-2 font-mono text-xs text-muted-foreground">
                            {operation.sequence_number.toString().padStart(2, "0")}
                          </span>
                          {operation.instruction}
                        </span>
                        <Badge variant={operation.status === "completed" ? "success" : "secondary"}>
                          {operationStatusLabel(operation.status)}
                        </Badge>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
