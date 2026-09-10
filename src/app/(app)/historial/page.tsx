import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { orderStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/ui/states";

export const metadata = { title: "Historial" };

const MOVEMENT_LABEL: Record<string, string> = {
  entry: "Entrada",
  reservation: "Reserva",
  consumption: "Consumo",
  release: "Liberacion",
  adjustment: "Ajuste",
  discard: "Descarte",
};

export default async function HistoryPage() {
  await requirePermission("reports.view");
  const repo = getRepository();
  const jobs = repo.listJobs({ status: "completed" });
  const orders = repo.listOrders({ status: "completed" });
  const movements = repo.listMovements(20);

  return (
    <div>
      <PageHeader title="Historial" description="Trabajos y pedidos completados, y movimientos recientes." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trabajos completados</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay trabajos completados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajo</TableHead>
                    <TableHead className="hidden sm:table-cell">Completado</TableHead>
                    <TableHead>Aprovechamiento</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
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
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(job.completed_at)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-emerald-700">
                        {formatPercent(job.utilization_percent)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatMoney(job.total_material_cost_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos completados</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay pedidos completados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead className="hidden sm:table-cell">Completado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/pedidos/${order.id}`} className="font-medium text-primary hover:underline">
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(order.completed_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{orderStatusLabel(order.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatMoney(order.total_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos de inventario</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <EmptyState title="Sin movimientos" description="Los movimientos de inventario apareceran aqui." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead className="hidden sm:table-cell">Referencia</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{MOVEMENT_LABEL[movement.movement_type]}</TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {movement.reference_type ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(movement.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
