import { discardRemnantAction } from "@/actions/inventory";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { formatDate, formatDimensions } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/states";
import type { RemnantStatus } from "@/types/domain";
import { RemnantFilters } from "./remnant-filters";
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
  searchParams: Promise<{
    product?: string;
    min_width?: string;
    min_height?: string;
    status?: string;
  }>;
}) {
  const user = await requirePermission("inventory.view");
  const params = await searchParams;
  const repo = getRepository();
  const remnants = repo.listRemnants({
    product_id: params.product || undefined,
    min_width: params.min_width ? Math.round(Number(params.min_width) * 10) : undefined,
    min_height: params.min_height ? Math.round(Number(params.min_height) * 10) : undefined,
    status: (params.status as RemnantStatus) || undefined,
  });
  const products = repo.listProducts();
  const canManage = user.role === "admin" || user.role === "supervisor";

  return (
    <div>
      <PageHeader
        eyebrow="Inventario"
        title="Retazos"
        description="Aprovecha sobrantes antes de consumir una plancha nueva."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <RemnantFilters products={products} current={params} />

          {remnants.length === 0 ? (
            <EmptyState
              title="Sin retazos"
              description="Los retazos generados al finalizar un corte apareceran aqui."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {remnants.map((remnant) => (
                <div key={remnant.id} className="panel p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold">{remnant.product_name}</p>
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
                      <Button type="submit" variant="secondary" size="sm">
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
