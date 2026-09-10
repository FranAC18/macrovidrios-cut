import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { orderStatusLabel } from "@/domain/orders/status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/ui/states";
import type { OrderStatus } from "@/types/domain";

export const metadata = { title: "Pedidos" };

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "info" | "success" | "warning"> = {
  draft: "secondary",
  pending: "info",
  queued: "warning",
  in_progress: "warning",
  completed: "success",
  cancelled: "secondary",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requirePermission("orders.manage");
  const params = await searchParams;
  const repo = getRepository();
  const orders = repo.listOrders({
    status: (params.status as OrderStatus) || undefined,
    search: params.q,
  });

  return (
    <div>
      <PageHeader title="Pedidos" description="Cola de produccion y pedidos en curso.">
        <Link href="/pedidos/nuevo" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </Link>
      </PageHeader>

      <form className="mb-4 grid gap-3 panel p-4 sm:grid-cols-[2fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={params.q} placeholder="Buscar numero, cliente o referencia" className="pl-9" />
        </div>
        <Select name="status" defaultValue={params.status ?? ""}>
          <option value="">Todos los estados</option>
          {(["draft", "pending", "queued", "in_progress", "completed", "cancelled"] as OrderStatus[]).map(
            (status) => (
              <option key={status} value={status}>
                {orderStatusLabel(status)}
              </option>
            ),
          )}
        </Select>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Filtrar
        </button>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          title="Sin pedidos"
          description="Crea un pedido para comenzar a planificar el corte."
          actionLabel="Nuevo pedido"
          actionHref="/pedidos/nuevo"
        />
      ) : (
        <div className="panel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Compromiso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const detail = repo.getOrderDetail(order.id);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/pedidos/${order.id}`} className="font-medium text-primary hover:underline">
                        {order.order_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order.reference ?? `${detail?.items.length ?? 0} lineas`}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {detail?.customer?.full_name ?? "Sin cliente"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {order.due_at ? formatDateOnly(order.due_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status]}>{orderStatusLabel(order.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatMoney(order.total_cents)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
