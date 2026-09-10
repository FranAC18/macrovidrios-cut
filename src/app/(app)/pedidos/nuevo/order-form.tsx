"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { createOrderAction, type OrderActionState } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { MaterialSelect } from "@/components/forms/material-select";
import { cn } from "@/lib/utils";
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

function emptyRow(): Row {
  return { key: rowKey++, glass_product_id: "", name: "", quantity: 1, width_mm: 0, height_mm: 0, rotatable: true };
}

function isComplete(row: Row): boolean {
  return (
    Boolean(row.glass_product_id) &&
    row.width_mm > 0 &&
    row.height_mm > 0 &&
    row.quantity > 0
  );
}

function trim(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function OrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: ProductView[];
}) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [expanded, setExpanded] = useState<number | null>(() => rows[0]?.key ?? null);
  const [clientError, setClientError] = useState<string | null>(null);

  const productName = (id: string) => products.find((product) => product.id === id)?.name ?? "Sin material";

  useEffect(() => {
    if (state.ok && state.orderId) {
      router.push(`/pedidos/${state.orderId}`);
    }
  }, [state.ok, state.orderId, router]);

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    const row = emptyRow();
    setRows((current) => [...current, row]);
    setExpanded(row.key);
    setClientError(null);
    requestAnimationFrame(() => {
      document.getElementById(`piece-${row.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const removeRow = (key: number) => {
    const next = rows.filter((row) => row.key !== key);
    if (next.length === 0) {
      const row = emptyRow();
      setRows([row]);
      setExpanded(row.key);
      return;
    }
    setRows(next);
    if (expanded === key) setExpanded(next[next.length - 1].key);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const incomplete = rows.find((row) => !isComplete(row));
    if (incomplete) {
      event.preventDefault();
      setExpanded(incomplete.key);
      setClientError("Completa el material, medidas y cantidad de todas las piezas antes de guardar.");
      requestAnimationFrame(() => {
        document.getElementById(`piece-${incomplete.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setClientError(null);
  };

  const cmToMm = (value: number) => Math.round((value || 0) * 10);
  const totalAreaM2 = rows.reduce(
    (sum, row) => sum + ((row.width_mm || 0) * (row.height_mm || 0) * (row.quantity || 0)) / 10_000,
    0,
  );
  const totalPieces = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
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
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Piezas</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? "linea" : "lineas"} · {totalPieces} piezas · {totalAreaM2.toFixed(2)} m²
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" />
            Agregar pieza
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row, index) => {
            const open = expanded === row.key;
            const complete = isComplete(row);
            return (
              <div
                key={row.key}
                id={`piece-${row.key}`}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  open ? "border-primary/40 bg-card" : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : row.key)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={open}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {complete
                          ? productName(row.glass_product_id)
                          : "Pieza sin completar"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {complete
                          ? `${trim(row.width_mm)} × ${trim(row.height_mm)} cm · ${row.quantity} ${row.quantity === 1 ? "unidad" : "unidades"}`
                          : "Toca para completar material, medidas y cantidad"}
                      </span>
                    </span>
                    {!complete ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-label="Incompleta" />
                    ) : null}
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                    />
                  </button>
                  {rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar pieza ${index + 1}`}
                      onClick={() => removeRow(row.key)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </div>

                {open ? (
                  <div className="animate-rise border-t border-border p-3">
                    <div className="grid gap-3 sm:grid-cols-5">
                      <div className="sm:col-span-5">
                        <MaterialSelect
                          products={products}
                          defaultValue={row.glass_product_id || undefined}
                          onProductChange={(id) => updateRow(row.key, { glass_product_id: id })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`width-${row.key}`}>Ancho (cm) *</Label>
                        <Input
                          id={`width-${row.key}`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={row.width_mm || ""}
                          onChange={(event) => updateRow(row.key, { width_mm: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`height-${row.key}`}>Alto (cm) *</Label>
                        <Input
                          id={`height-${row.key}`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={row.height_mm || ""}
                          onChange={(event) => updateRow(row.key, { height_mm: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`qty-${row.key}`}>Cantidad *</Label>
                        <Input
                          id={`qty-${row.key}`}
                          type="number"
                          inputMode="numeric"
                          value={row.quantity || ""}
                          onChange={(event) => updateRow(row.key, { quantity: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`name-${row.key}`}>Descripcion</Label>
                        <Input
                          id={`name-${row.key}`}
                          value={row.name}
                          onChange={(event) => updateRow(row.key, { name: event.target.value })}
                          placeholder="Ventanal, repisa..."
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm sm:col-span-5">
                        <input
                          type="checkbox"
                          checked={row.rotatable}
                          onChange={(event) => updateRow(row.key, { rotatable: event.target.checked })}
                          className="h-4 w-4"
                        />
                        Se puede rotar
                      </label>
                    </div>
                    {complete ? (
                      <div className="mt-3 flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(null)}>
                          <Pencil className="h-4 w-4" />
                          Listo
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <FieldError>{clientError ?? state.error}</FieldError>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creando pedido..." : "Crear pedido"}
        </Button>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        El total se calcula al confirmar con las reglas vigentes.
      </p>
    </form>
  );
}
