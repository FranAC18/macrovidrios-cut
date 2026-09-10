import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { roleLabel } from "@/domain/auth/permissions";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/states";
import { ColorForm, ProductForm, ThicknessForm } from "./catalog-forms";

export const metadata = { title: "Configuracion" };

export default async function SettingsPage() {
  const user = await requirePermission("catalog.view");
  const repo = getRepository();
  const colors = repo.listColors();
  const thicknesses = repo.listThicknesses();
  const products = repo.listProducts();
  const services = repo.listServices();
  const canManage = user.role === "admin" || user.role === "supervisor";

  return (
    <div>
      <PageHeader title="Configuracion" description="Catalogos, reglas de corte y servicios.">
        <Badge variant="secondary">Rol: {roleLabel(user.role)}</Badge>
      </PageHeader>

      <div className="space-y-6">
        {canManage ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Colores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <Badge key={color.id} variant="outline">
                      {color.name} ({color.code})
                    </Badge>
                  ))}
                </div>
                <ColorForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Espesores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {thicknesses.map((thickness) => (
                    <Badge key={thickness.id} variant="outline">
                      {thickness.thickness_mm} mm
                    </Badge>
                  ))}
                </div>
                <ThicknessForm />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Materiales (color + espesor)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {products.length} materiales configurados. El kerf, margen y separacion se heredan en cada cuadre.
                </p>
                <ProductForm colors={colors} thicknesses={thicknesses} />
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Servicios adicionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                  <span className="font-medium">{service.name}</span>
                  <span className="text-muted-foreground">
                    {formatMoney(service.unit_price_cents)} · {service.unit_type}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reglas de precio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Los valores de precio son provisionales hasta confirmar la formula comercial con MacroVidrios.
              </p>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <p>Material: precio por m² configurable.</p>
                <p>Corte: precio por pieza y por corte.</p>
                <p>TOTAL = MATERIAL + CORTE + SERVICIOS + MANO DE OBRA - DESCUENTO.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
