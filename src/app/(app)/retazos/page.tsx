import { discardRemnantAction } from "@/actions/inventory";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDimensions, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/states";
import type { RemnantStatus } from "@/types/domain";
import { RemnantForm } from "./remnant-form";

export const metadata = { title: "Retazos" };

const STATUS_LABEL: Record<RemnantStatus, string> = {
  available: "Disponible",
  reserved: "Reservado",
  consumed: "Utilizado",
  discarded: "Descartado",
};

export default async function RemnantsPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; min_width?: string; min_height?: string; status?: string }>;
}) {
  const user = await requirePermission("inventory.view");
  const params = await searchParams;
  const repo = getRepository();
  const remnants = repo.listRemnants({
    product_id: params.product || undefined,
    min_width: params.min_width ? Number(params.min_width) : undefined,
    min_height: params.min_height ? Number(params.min_height) : undefined,
    status: (params.status as RemnantStatus) || undefined,
  });
  const products = repo.listProducts();
  const canManage = user.role === "admin" || user.role === "supervisor";

  return (
    <div>
      <PageHeader
        title="Retazos"
        description="Aprovecha sobrantes antes de consumir una plancha nueva."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <form className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="product">Material</Label>
              <Select id="product" name="product" defaultValue={params.product ?? ""}>
                <option value="">Todos</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="min_width">Ancho min (mm)</Label>
              <Input id="min_width" name="min_width" type="number" defaultValue={params.min_width} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="min_height">Alto min (mm)</Label>
              <Input id="min_height" name="min_height" type="number" defaultValue={params.min_height} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Estado</Label>
              <Select id="status" name="status" defaultValue={params.status ?? ""}>
                <option value="">Todos</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end sm:col-span-3">
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                Filtrar
              </Button>
            </div>
          </form>

          {remnants.length === 0 ? (
            <EmptyState
              title="Sin retazos"
              description="Los retazos generados al finalizar un corte apareceran aqui."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {remnants.map((remnant) => (
                <div key={remnant.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{remnant.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDimensions(remnant.width_mm, remnant.height_mm)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        remnant.status === "available"
                          ? "success"
                          : remnant.status === "reserved"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {STATUS_LABEL[remnant.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Cantidad: {remnant.quantity}</span>
                    <span>{remnant.location ?? "Sin ubicacion"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registrado {formatDate(remnant.created_at)}
                  </p>
                  {canManage && remnant.status === "available" ? (
                    <form action={discardRemnantAction} className="mt-3">
                      <input type="hidden" name="id" value={remnant.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Descartar
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {canManage ? (
          <RemnantForm products={products} />
        ) : (
          <EmptyState title="Solo lectura" description="Tu rol puede consultar retazos, no registrarlos." />
        )}
      </div>
    </div>
  );
}
