"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createOrderAction, type OrderActionState } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { MaterialSelect } from "@/components/forms/material-select";
import type { ProductView } from "@/lib/data";
import type { Customer } from "@/types/domain";

interface Row {
  key: number;
  glass_product_id: string;
  name: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  rotatable: boolean;
}

const initialState: OrderActionState = {};

let rowKey = 0;

export function OrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: ProductView[];
}) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([
    { key: rowKey++, glass_product_id: "", name: "", quantity: 1, width_mm: 0, height_mm: 0, rotatable: true },
  ]);

  useEffect(() => {
    if (state.ok && state.orderId) {
      router.push(`/pedidos/${state.orderId}`);
    }
  }, [state.ok, state.orderId, router]);

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const totalAreaM2 = rows.reduce(
    (sum, row) => sum + ((row.width_mm || 0) * (row.height_mm || 0) * (row.quantity || 0)) / 10_000,
    0,
  );

  const cmToMm = (value: number) => Math.round((value || 0) * 10);

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="items_json"
        value={JSON.stringify(
          rows.map((row) => ({
            glass_product_id: row.glass_product_id,
            name: row.name || null,
            quantity: row.quantity,
            width_mm: cmToMm(row.width_mm),
            height_mm: cmToMm(row.height_mm),
            rotatable: row.rotatable,
            notes: null,
          })),
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>Datos del pedido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_id">Cliente</Label>
            <Select id="customer_id" name="customer_id" defaultValue="">
              <option value="">Sin cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Referencia</Label>
            <Input id="reference" name="reference" placeholder="Obra, proyecto o nota corta" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_at">Fecha compromiso</Label>
            <Input id="due_at" name="due_at" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Descuento (USD)</Label>
            <Input id="discount" name="discount" type="number" step="0.01" inputMode="decimal" defaultValue={0} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Piezas</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((current) => [
                ...current,
                { key: rowKey++, glass_product_id: "", name: "", quantity: 1, width_mm: 0, height_mm: 0, rotatable: true },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Agregar pieza
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.key} className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Pieza {index + 1}
                </span>
                {rows.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar pieza"
                    onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <MaterialSelect
                    products={products}
                    defaultValue={row.glass_product_id || undefined}
                    onProductChange={(id) => updateRow(row.key, { glass_product_id: id })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ancho (cm) *</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={row.width_mm || ""}
                    onChange={(event) => updateRow(row.key, { width_mm: Number(event.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Alto (cm) *</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={row.height_mm || ""}
                    onChange={(event) => updateRow(row.key, { height_mm: Number(event.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={row.quantity || ""}
                    onChange={(event) => updateRow(row.key, { quantity: Number(event.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Descripcion</Label>
                  <Input
                    value={row.name}
                    onChange={(event) => updateRow(row.key, { name: event.target.value })}
                    placeholder="Ventanal, repisa..."
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.rotatable}
                    onChange={(event) => updateRow(row.key, { rotatable: event.target.checked })}
                    className="h-4 w-4"
                  />
                  Se puede rotar
                </label>
              </div>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            Area total de piezas: {totalAreaM2.toFixed(2)} m²
          </p>
        </CardContent>
      </Card>

      <FieldError>{state.error}</FieldError>
      <div className="flex justify-end gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creando pedido..." : "Crear pedido"}
        </Button>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        El total se calcula al confirmar. Costo estimado de referencia segun reglas vigentes.
      </p>
    </form>
  );
}
