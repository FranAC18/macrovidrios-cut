import Link from "next/link";
import { ArrowRight, Plus, Scissors } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { jobStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui/states";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const repo = getRepository();
  const dashboard = repo.getDashboard();

  return (
    <div>
      <PageHeader
        title={`Hola, ${user.full_name.split(" ")[0]}`}
        description="Resumen accionable del taller."
      >
        <Link href="/pedidos/nuevo" className={buttonVariants({ variant: "outline" })}>
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </Link>
        <Link href="/cuadres/nuevo" className={buttonVariants()}>
          <Scissors className="h-4 w-4" />
          Nuevo corte
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pedidos pendientes" value={dashboard.pendingOrders} />
        <StatCard label="Trabajos en corte" value={dashboard.jobsInProgress} tone="warning" />
        <StatCard label="Retazos disponibles" value={dashboard.availableRemnants} />
        <StatCard
          label="Aprovechamiento promedio"
          value={formatPercent(dashboard.averageUtilization)}
          tone="success"
          hint={`Desperdicio ${formatPercent(dashboard.wastePercent)}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Trabajos recientes</CardTitle>
            <Link href="/cuadres" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay trabajos de corte.</p>
            ) : (
              dashboard.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/cuadres/${job.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-semibold">{job.job_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(job.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-emerald-700">
                      {formatPercent(job.utilization_percent)}
                    </span>
                    <Badge variant="info">{jobStatusLabel(job.status)}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Stock bajo</CardTitle>
            <Link href="/planchas" className="text-sm text-primary hover:underline">
              Ver inventario
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas de material.</p>
            ) : (
              dashboard.lowStock.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{sheet.product_name}</p>
                    <p className="text-xs text-muted-foreground">{sheet.sheet_type_name}</p>
                  </div>
                  <Badge variant={sheet.quantity <= 1 ? "destructive" : "warning"}>
                    {sheet.quantity} unidades
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
