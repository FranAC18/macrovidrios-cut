import { Search } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/ui/states";
import { CustomerForm } from "./customer-form";

export const metadata = { title: "Clientes" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("orders.manage");
  const { q } = await searchParams;
  const customers = getRepository().listCustomers(q);

  return (
    <div>
      <PageHeader title="Clientes" description="Administra clientes y su informacion de contacto." />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Buscar por nombre, identificacion o telefono" className="pl-9" />
          </form>

          {customers.length === 0 ? (
            <EmptyState
              title="Sin clientes"
              description="Crea el primer cliente para asociarlo a los pedidos."
            />
          ) : (
            <div className="panel overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="hidden md:table-cell">Creado</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <p className="font-medium">{customer.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.identification_number ?? "Sin identificacion"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {customer.phone ?? customer.email ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.active ? "success" : "secondary"}>
                          {customer.active ? "Activo" : "Archivado"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <CustomerForm />
      </div>
    </div>
  );
}
