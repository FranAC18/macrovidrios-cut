"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createInventorySheetAction,
  createSheetTypeAction,
  type CatalogActionState,
} from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import type { ProductView } from "@/lib/data";
import type { SheetType } from "@/types/domain";

const initialState: CatalogActionState = {};

export function SheetTypeForm() {
  const [state, formAction, pending] = useActionState(createSheetTypeAction, initialState);
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
        <CardTitle>Nuevo formato de plancha</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="st-name">Nombre *</Label>
            <Input id="st-name" name="name" placeholder="Plancha 3210 × 2140" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-width">Ancho (cm) *</Label>
            <Input id="st-width" name="width_cm" type="number" step="0.1" inputMode="decimal" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-height">Alto (cm) *</Label>
            <Input id="st-height" name="height_cm" type="number" step="0.1" inputMode="decimal" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="st-cost">Costo por plancha (USD)</Label>
            <Input id="st-cost" name="default_cost" type="number" step="0.01" inputMode="decimal" />
          </div>
          <div className="sm:col-span-2">
            <FieldError>{state.error}</FieldError>
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Guardando..." : "Guardar formato"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function InventorySheetForm({
  products,
  sheetTypes,
}: {
  products: ProductView[];
  sheetTypes: SheetType[];
}) {
  const [state, formAction, pending] = useActionState(createInventorySheetAction, initialState);
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
        <CardTitle>Registrar planchas</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="is-product">Material *</Label>
            <Select id="is-product" name="glass_product_id" required defaultValue="">
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="is-sheet">Formato *</Label>
            <Select id="is-sheet" name="sheet_type_id" required defaultValue="">
              <option value="" disabled>
                Selecciona formato
              </option>
              {sheetTypes.map((sheetType) => (
                <option key={sheetType.id} value={sheetType.id}>
                  {sheetType.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="is-qty">Cantidad *</Label>
            <Input id="is-qty" name="quantity" type="number" inputMode="numeric" defaultValue={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="is-cost">Costo unitario (USD)</Label>
            <Input id="is-cost" name="unit_cost" type="number" step="0.01" inputMode="decimal" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="is-location">Ubicacion</Label>
            <Input id="is-location" name="location" placeholder="Bodega A" />
          </div>
          <div className="sm:col-span-2">
            <FieldError>{state.error}</FieldError>
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Guardando..." : "Registrar planchas"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
