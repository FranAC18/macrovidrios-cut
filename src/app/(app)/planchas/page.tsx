import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDimensions, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/ui/states";
import { InventorySheetForm, SheetTypeForm } from "./planchas-forms";

export const metadata = { title: "Planchas" };

export default async function SheetsPage() {
  const user = await requirePermission("inventory.view");
  const repo = getRepository();
  const sheets = repo.listInventorySheets();
  const products = repo.listProducts();
  const sheetTypes = repo.listSheetTypes();
  const canManage = user.role === "admin" || user.role === "supervisor";

  return (
    <div>
      <PageHeader
        title="Planchas"
        description="Existencias, formatos y costos de plancha por material."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {sheets.length === 0 ? (
            <EmptyState title="Sin planchas registradas" description="Registra existencias para poder cuadrar." />
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead className="hidden sm:table-cell">Costo</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets.map((sheet) => (
                    <TableRow key={sheet.id}>
                      <TableCell>
                        <p className="font-medium">{sheet.product_name}</p>
                        <p className="text-xs text-muted-foreground">{sheet.location ?? "Sin ubicacion"}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDimensions(sheet.width_mm, sheet.height_mm)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {formatMoney(sheet.unit_cost_cents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sheet.status !== "available"
                              ? "secondary"
                              : sheet.quantity <= 3
                                ? "warning"
                                : "success"
                          }
                        >
                          {sheet.status === "available" ? `${sheet.quantity} disp.` : sheet.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Formatos configurados</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {sheetTypes.map((sheetType) => (
                <div key={sheetType.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">{sheetType.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDimensions(sheetType.width_mm, sheetType.height_mm)} ·{" "}
                    {formatMoney(sheetType.default_cost_cents)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="space-y-4">
            <InventorySheetForm products={products} sheetTypes={sheetTypes} />
            <SheetTypeForm />
          </div>
        ) : (
          <EmptyState title="Solo lectura" description="Tu rol puede consultar inventario, no modificarlo." />
        )}
      </div>
    </div>
  );
}
