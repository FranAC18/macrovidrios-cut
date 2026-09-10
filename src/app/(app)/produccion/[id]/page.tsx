import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { can } from "@/domain/auth/permissions";
import type { CuttingArea, Placement } from "@/lib/optimization/types";
import type { LayoutPlacementView } from "@/components/cutting/layout-viewer";
import { ProductionMode, type ProductionLayout, type ProductionOperation } from "../production-mode";

export const metadata = { title: "Modo de corte" };

interface LayoutGeometry {
  placements?: Placement[];
  areas?: CuttingArea[];
  material?: { material_id?: string };
}

export default async function ProductionJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("cutting.produce");
  const { id } = await params;
  const repo = getRepository();
  const detail = repo.getJobDetail(id);
  if (!detail) notFound();

  const { job, layouts, operations, pieces } = detail;
  const pieceCodeById = new Map(pieces.map((piece) => [piece.id, piece.piece_code] as const));

  const productionLayouts: ProductionLayout[] = layouts.map((layout) => {
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
    return {
      id: layout.id,
      sequence_number: layout.sequence_number,
      material_type: layout.material_type,
      width_mm: layout.width_mm,
      height_mm: layout.height_mm,
      utilization_percent: layout.utilization_percent,
      placements,
    };
  });

  const productionOperations: ProductionOperation[] = operations.map((operation) => ({
    id: operation.id,
    cutting_layout_id: operation.cutting_layout_id,
    sequence_number: operation.sequence_number,
    instruction: operation.instruction,
    axis: operation.axis,
    position_mm: operation.position_mm,
    cut_length_mm: operation.cut_length_mm,
    status: operation.status,
  }));

  const firstGeometry = (layouts[0]?.geometry_json ?? {}) as LayoutGeometry;
  const productId = firstGeometry.material?.material_id ?? "";

  return (
    <div>
      <Link
        href="/produccion"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a produccion
      </Link>
      <ProductionMode
        job={{ id: job.id, job_number: job.job_number, status: job.status }}
        layouts={productionLayouts}
        operations={productionOperations}
        productId={productId}
        productName={repo.getProductView(productId)?.name ?? "material"}
        canForce={can(user.role, "jobs.force_complete")}
      />
    </div>
  );
}
