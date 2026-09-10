import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Scissors } from "lucide-react";
import { transitionOrderAction } from "@/actions/orders";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate, formatDateOnly, formatDimensions, formatMoney } from "@/lib/format";
import { canTransitionOrder, jobStatusLabel, orderStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/states";

export const metadata = { title: "Detalle de pedido" };

const NEXT_LABEL: Record<string, string> = {
  draft: "Volver a borrador",
  pending: "Marcar pendiente",
  queued: "Enviar a cola",
  in_progress: "Pasar a corte",
  completed: "Completar",
  cancelled: "Cancelar",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("orders.manage");
  const { id } = await params;
  const repo = getRepository();
  const detail = repo.getOrderDetail(id);
  if (!detail) notFound();

  const { order, customer, items, pieces, jobs } = detail;
  const nextStatuses = (
    ["draft", "pending", "queued", "in_progress", "completed", "cancelled"] as const
  ).filter((status) => canTransitionOrder(order.status, status));

  return (
    <div>
      <Link href="/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>
      <PageHeader
        title={order.order_number}
        description={`${customer?.full_name ?? "Sin cliente"} · ${order.reference ?? "Sin referencia"}`}
      >
        <Badge variant="info">{orderStatusLabel(order.status)}</Badge>
        <Link href={`/cuadres/nuevo?order=${order.id}`} className={buttonVariants()}>
          <Scissors className="h-4 w-4" />
          Cuadrar
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Piezas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Medidas</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead className="text-right">Codigos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{formatDimensions(item.width_mm, item.height_mm)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {pieces
                        .filter((piece) => piece.order_item_id === item.id)
                        .map((piece) => piece.piece_code)
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solicitado</span>
                <span>{formatDate(order.requested_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compromiso</span>
                <span>{order.due_at ? formatDateOnly(order.due_at) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span>-{formatMoney(order.discount_cents)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatMoney(order.total_cents)}</span>
              </div>
              {order.notes ? (
                <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{order.notes}</p>
              ) : null}
            </CardContent>
          </Card>

          {nextStatuses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <form key={status} action={transitionOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button
                      type="submit"
                      variant={status === "cancelled" ? "destructive" : status === "completed" ? "default" : "outline"}
                      size="sm"
                    >
                      {NEXT_LABEL[status]}
                    </Button>
                  </form>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {jobs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Trabajos de corte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/cuadres/${job.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-2 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{job.job_number}</span>
                    <Badge variant="secondary">{jobStatusLabel(job.status)}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
