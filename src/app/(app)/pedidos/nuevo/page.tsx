import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/ui/states";
import { OrderForm } from "./order-form";

export const metadata = { title: "Nuevo pedido" };

export default async function NewOrderPage() {
  await requirePermission("orders.manage");
  const repo = getRepository();
  const customers = repo.listCustomers().filter((customer) => customer.active);
  const products = repo.listProducts();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Nuevo pedido" description="Captura las piezas sin preocuparte por el algoritmo." />
      <OrderForm customers={customers} products={products} />
    </div>
  );
}
