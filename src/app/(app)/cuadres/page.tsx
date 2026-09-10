import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { jobStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/ui/states";

export const metadata = { title: "Cuadres" };

export default async function CuttingJobsPage() {
  await requirePermission("cutting.create");
  const repo = getRepository();
  const jobs = repo.listJobs();

  return (
    <div>
      <PageHeader title="Cuadres" description="Trabajos de corte y su aprovechamiento.">
        <Link href="/cuadres/nuevo" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Nuevo cuadre
        </Link>
      </PageHeader>

      {jobs.length === 0 ? (
        <EmptyState
          title="Sin cuadres"
          description="Crea un cuadre a partir de los pedidos en cola."
          actionLabel="Nuevo cuadre"
          actionHref="/cuadres/nuevo"
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajo</TableHead>
                <TableHead className="hidden sm:table-cell">Estrategia</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Aprovechamiento</TableHead>
                <TableHead className="text-right">Costo material</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link href={`/cuadres/${job.id}`} className="font-medium text-primary hover:underline">
                      {job.job_number}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm capitalize text-muted-foreground">
                    {job.material_strategy}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-emerald-700">
                    {formatPercent(job.utilization_percent)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatMoney(job.total_material_cost_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.status === "completed" ? "success" : "info"}>
                      {jobStatusLabel(job.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
