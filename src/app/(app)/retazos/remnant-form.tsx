"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createRemnantAction, type RemnantActionState } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import type { ProductView } from "@/lib/data";

const initialState: RemnantActionState = {};

export function RemnantForm({ products }: { products: ProductView[] }) {
  const [state, formAction, pending] = useActionState(createRemnantAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar retazo</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="r-product">Material *</Label>
            <Select id="r-product" name="glass_product_id" required defaultValue="">
              <option value="" disabled>
                Selecciona color y espesor
              </option>
              {products
                .filter((product) => product.active)
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-width">Ancho (cm) *</Label>
            <Input id="r-width" name="width_cm" type="number" step="0.1" inputMode="decimal" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-height">Alto (cm) *</Label>
            <Input id="r-height" name="height_cm" type="number" step="0.1" inputMode="decimal" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-qty">Cantidad *</Label>
            <Input id="r-qty" name="quantity" type="number" inputMode="numeric" defaultValue={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-location">Ubicacion</Label>
            <Input id="r-location" name="location" placeholder="Bodega A" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="r-notes">Notas</Label>
            <Textarea id="r-notes" name="notes" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <FieldError>{state.error}</FieldError>
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Guardando..." : "Registrar retazo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
