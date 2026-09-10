import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { PageHeader } from "@/components/ui/states";
import type { RemnantOption, SheetOption, WizardOrder } from "./cutting-wizard";
import { CuttingWizard } from "./cutting-wizard";

export const metadata = { title: "Nuevo cuadre" };

export default async function NewCuttingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requirePermission("cutting.create");
  const { order: preselectedOrderId } = await searchParams;
  const repo = getRepository();

  const eligible = repo
    .listOrders()
    .filter((order) => ["draft", "pending", "queued"].includes(order.status));

  const orders: WizardOrder[] = eligible.map((order) => {
    repo.ensurePiecesForOrder(order.id);
    const detail = repo.getOrderDetail(order.id);
    const productByItem = new Map(
      (detail?.items ?? []).map((item) => [item.id, item] as const),
    );
    return {
      id: order.id,
      order_number: order.order_number,
      customer_name: detail?.customer?.full_name ?? "Sin cliente",
      status: order.status,
      pieces: (detail?.pieces ?? [])
        .filter((piece) => piece.status === "pending")
        .map((piece) => {
          const item = productByItem.get(piece.order_item_id);
          return {
            id: piece.id,
            code: piece.piece_code,
            width_mm: piece.requested_width_mm,
            height_mm: piece.requested_height_mm,
            rotatable: item?.rotatable ?? true,
            product_id: item?.glass_product_id ?? "",
            product_name: item?.product_name ?? "—",
          };
        }),
    };
  });

  const sheetOptions: SheetOption[] = [];
  for (const sheet of repo.listInventorySheets()) {
    if (sheet.status !== "available" || sheet.quantity < 1) continue;
    const exists = sheetOptions.some(
      (option) => option.id === sheet.sheet_type_id && option.product_id === sheet.glass_product_id,
    );
    if (!exists) {
      sheetOptions.push({
        id: sheet.sheet_type_id,
        name: sheet.sheet_type_name,
        width_mm: sheet.width_mm,
        height_mm: sheet.height_mm,
        product_id: sheet.glass_product_id,
      });
    }
  }

  const remnantOptions: RemnantOption[] = repo
    .listRemnants({ status: "available" })
    .map((remnant) => ({
      id: remnant.id,
      width_mm: remnant.width_mm,
      height_mm: remnant.height_mm,
      product_id: remnant.glass_product_id,
      product_name: remnant.product_name,
    }));

  return (
    <div>
      <PageHeader
        title="Nuevo cuadre"
        description="Selecciona pedidos, material y obtén la mejor distribucion."
      />
      <CuttingWizard
        orders={orders}
        sheetOptions={sheetOptions}
        remnantOptions={remnantOptions}
        preselectedOrderId={preselectedOrderId}
      />
    </div>
  );
}
