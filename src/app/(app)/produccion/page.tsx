import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { jobStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/states";

export const metadata = { title: "Produccion" };

export default async function ProductionPage() {
  await requirePermission("cutting.produce");
  const repo = getRepository();
  const jobs = repo
    .listJobs()
    .filter((job) => ["optimized", "ready", "in_progress"].includes(job.status));

  return (
    <div>
      <PageHeader title="Produccion" description="Trabajos listos o en corte." />
      {jobs.length === 0 ? (
        <EmptyState
          title="Sin trabajos en produccion"
          description="Inicia un cuadre para verlo aqui."
          actionLabel="Ir a cuadres"
          actionHref="/cuadres"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/produccion/${job.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">{job.job_number}</p>
                    <Badge variant={job.status === "in_progress" ? "warning" : "info"}>
                      {jobStatusLabel(job.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(job.created_at)}</p>
                  <p className="text-sm font-medium text-emerald-700">
                    {formatPercent(job.utilization_percent)} de aprovechamiento
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
