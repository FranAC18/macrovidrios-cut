"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, Layers, Plus, Trash2 } from "lucide-react";
import { createOrderAction, type OrderActionState } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { MaterialSelect } from "@/components/forms/material-select";
import { MaterialSwatch } from "@/components/forms/material-swatch";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/lib/data";
import type { Customer } from "@/types/domain";

interface PieceRow {
  key: number;
  name: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  rotatable: boolean;
}

interface MaterialGroup {
  key: number;
  glass_product_id: string;
  pieces: PieceRow[];
}

const initialState: OrderActionState = {};
let keyCounter = 0;
const nextKey = () => keyCounter++;

function emptyPiece(): PieceRow {
  return { key: nextKey(), name: "", quantity: 1, width_mm: 0, height_mm: 0, rotatable: true };
}

function emptyGroup(): MaterialGroup {
  return { key: nextKey(), glass_product_id: "", pieces: [emptyPiece()] };
}

function isPieceComplete(piece: PieceRow): boolean {
  return piece.width_mm > 0 && piece.height_mm > 0 && piece.quantity > 0;
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
  const [groups, setGroups] = useState<MaterialGroup[]>(() => [emptyGroup()]);
  const [openGroup, setOpenGroup] = useState<number | null>(() => groups[0]?.key ?? null);
  const [openPiece, setOpenPiece] = useState<number | null>(() => groups[0]?.pieces[0]?.key ?? null);
  const [openData, setOpenData] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [reference, setReference] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const productName = (id: string) => products.find((product) => product.id === id)?.name ?? "Sin material";
  const colorName = (id: string) => products.find((product) => product.id === id)?.color_name ?? null;

  const groupArea = (group: MaterialGroup) =>
    group.pieces.reduce(
      (sum, piece) => sum + ((piece.width_mm || 0) * (piece.height_mm || 0) * (piece.quantity || 0)) / 10_000,
      0,
    );

  useEffect(() => {
    if (state.ok && state.orderId) {
      router.push(`/pedidos/${state.orderId}`);
    }
  }, [state.ok, state.orderId, router]);

  const scrollTo = (id: string) =>
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }));

  const updateGroup = (key: number, patch: Partial<MaterialGroup>) => {
    setGroups((current) => current.map((group) => (group.key === key ? { ...group, ...patch } : group)));
  };

  const updatePiece = (groupKey: number, pieceKey: number, patch: Partial<PieceRow>) => {
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey
          ? { ...group, pieces: group.pieces.map((piece) => (piece.key === pieceKey ? { ...piece, ...patch } : piece)) }
          : group,
      ),
    );
  };

  const toggleGroup = (group: MaterialGroup) => {
    if (openGroup === group.key) {
      setOpenGroup(null);
      setOpenPiece(null);
      return;
    }
    const firstIncomplete = group.pieces.find((piece) => !isPieceComplete(piece));
    setOpenGroup(group.key);
    setOpenPiece(firstIncomplete?.key ?? null);
  };

  const addGroup = () => {
    const group = emptyGroup();
    setGroups((current) => [...current, group]);
    setOpenGroup(group.key);
    setOpenPiece(group.pieces[0].key);
    setClientError(null);
    scrollTo(`group-${group.key}`);
  };

  const removeGroup = (key: number) => {
    const next = groups.filter((group) => group.key !== key);
    if (next.length === 0) {
      const group = emptyGroup();
      setGroups([group]);
      setOpenGroup(group.key);
      setOpenPiece(group.pieces[0].key);
      return;
    }
    setGroups(next);
    if (openGroup === key) {
      setOpenGroup(next[next.length - 1].key);
      setOpenPiece(null);
    }
  };

  const addPiece = (groupKey: number) => {
    const piece = emptyPiece();
    setGroups((current) =>
      current.map((group) => (group.key === groupKey ? { ...group, pieces: [...group.pieces, piece] } : group)),
    );
    setOpenGroup(groupKey);
    setOpenPiece(piece.key);
    setClientError(null);
    scrollTo(`piece-${groupKey}-${piece.key}`);
  };

  const removePiece = (groupKey: number, pieceKey: number) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.key !== groupKey) return group;
        const pieces = group.pieces.filter((piece) => piece.key !== pieceKey);
        if (pieces.length === 0) {
          const piece = emptyPiece();
          setOpenPiece(piece.key);
          return { ...group, pieces: [piece] };
        }
        if (openPiece === pieceKey) setOpenPiece(pieces[pieces.length - 1].key);
        return { ...group, pieces };
      }),
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const groupWithoutMaterial = groups.find((group) => !group.glass_product_id);
    if (groupWithoutMaterial) {
      event.preventDefault();
      setOpenGroup(groupWithoutMaterial.key);
      setClientError("Elige el color y espesor de cada material antes de guardar.");
      scrollTo(`group-${groupWithoutMaterial.key}`);
      return;
    }
    for (const group of groups) {
      const incomplete = group.pieces.find((piece) => !isPieceComplete(piece));
      if (incomplete) {
        event.preventDefault();
        setOpenGroup(group.key);
        setOpenPiece(incomplete.key);
        setClientError("Completa ancho, alto y cantidad de todas las piezas antes de guardar.");
        scrollTo(`piece-${group.key}-${incomplete.key}`);
        return;
      }
    }
    setClientError(null);
  };

  const cmToMm = (value: number) => Math.round((value || 0) * 10);
  const allPieces = groups.flatMap((group) => group.pieces);
  const totalPieces = allPieces.reduce((sum, piece) => sum + (piece.quantity || 0), 0);
  const totalAreaM2 = allPieces.reduce(
    (sum, piece) => sum + ((piece.width_mm || 0) * (piece.height_mm || 0) * (piece.quantity || 0)) / 10_000,
    0,
  );

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <input
        type="hidden"
        name="items_json"
        value={JSON.stringify(
          groups.flatMap((group) =>
            group.pieces.map((piece) => ({
              glass_product_id: group.glass_product_id,
              name: piece.name || null,
              quantity: piece.quantity,
              width_mm: cmToMm(piece.width_mm),
              height_mm: cmToMm(piece.height_mm),
              rotatable: piece.rotatable,
              notes: null,
            })),
          ),
        )}
      />

      <Card>
        <button
          type="button"
          onClick={() => setOpenData((value) => !value)}
          aria-expanded={openData}
          className="flex w-full items-center justify-between gap-2 p-5 text-left sm:p-6"
        >
          <span className="min-w-0">
            <span className="block font-display text-base font-bold tracking-tight sm:text-lg">
              Datos del pedido
            </span>
            <span className="mt-1 block truncate text-sm text-muted-foreground">
              {customers.find((customer) => customer.id === customerId)?.full_name ?? "Sin cliente"}
              {reference ? ` · ${reference}` : ""}
            </span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", openData && "rotate-180")}
          />
        </button>
        <CardContent className={cn("grid gap-4 sm:grid-cols-2", !openData && "hidden")}>
          <div className="space-y-2">
            <Label htmlFor="customer_id">Cliente</Label>
            <Select
              id="customer_id"
              name="customer_id"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
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
            <Input
              id="reference"
              name="reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Obra, proyecto o nota corta"
            />
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
            <CardTitle>Materiales y piezas</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {groups.length} {groups.length === 1 ? "material" : "materiales"} · {totalPieces} piezas ·{" "}
              {totalAreaM2.toFixed(2)} m²
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addGroup}>
            <Layers className="h-4 w-4" />
            Agregar material
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.map((group, groupIndex) => {
            const materialOpen = openGroup === group.key;
            const hasMaterial = Boolean(group.glass_product_id);
            const groupComplete = hasMaterial && group.pieces.every(isPieceComplete);
            return (
              <div
                key={group.key}
                id={`group-${group.key}`}
                className={cn(
                  "overflow-hidden rounded-xl border bg-card transition-colors",
                  materialOpen ? "border-primary/50" : "border-border",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={materialOpen}
                  >
                    <span className="relative shrink-0">
                      <MaterialSwatch colorName={hasMaterial ? colorName(group.glass_product_id) : null} />
                      <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                        {groupIndex + 1}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {hasMaterial ? productName(group.glass_product_id) : "Elige el material"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {group.pieces.length} {group.pieces.length === 1 ? "pieza" : "piezas"} ·{" "}
                        {groupArea(group).toFixed(2)} m²
                      </span>
                    </span>
                    {!groupComplete ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-label="Incompleto" />
                    ) : null}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        materialOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {groups.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar material ${groupIndex + 1}`}
                      onClick={() => removeGroup(group.key)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </div>

                {materialOpen ? (
                  <div className="animate-rise space-y-3 border-t border-border p-3">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <MaterialSelect
                        products={products}
                        defaultValue={group.glass_product_id || undefined}
                        onProductChange={(id) => updateGroup(group.key, { glass_product_id: id })}
                      />
                    </div>

                    <div className="space-y-2">
                      {group.pieces.map((piece, pieceIndex) => {
                        const pieceOpen = openPiece === piece.key;
                        const complete = isPieceComplete(piece);
                        return (
                          <div
                            key={piece.key}
                            id={`piece-${group.key}-${piece.key}`}
                            className={cn(
                              "overflow-hidden rounded-lg border bg-card transition-colors",
                              pieceOpen ? "border-primary/40" : "border-border",
                            )}
                          >
                            <div className="flex items-center gap-2 px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setOpenPiece(pieceOpen ? null : piece.key)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                aria-expanded={pieceOpen}
                              >
                                <span className="text-xs font-bold text-muted-foreground">
                                  Pieza {pieceIndex + 1}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                  {complete
                                    ? `${trim(piece.width_mm)} × ${trim(piece.height_mm)} cm · ${piece.quantity} ${piece.quantity === 1 ? "unidad" : "unidades"}`
                                    : "Sin medidas"}
                                </span>
                                {!complete ? (
                                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-label="Incompleta" />
                                ) : null}
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                    pieceOpen && "rotate-180",
                                  )}
                                />
                              </button>
                              {group.pieces.length > 1 ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Eliminar pieza ${pieceIndex + 1}`}
                                  onClick={() => removePiece(group.key, piece.key)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              ) : null}
                            </div>

                            {pieceOpen ? (
                              <div className="animate-rise border-t border-border p-3">
                                <div className="grid gap-3 sm:grid-cols-5">
                                  <div className="space-y-1">
                                    <Label htmlFor={`width-${group.key}-${piece.key}`}>Ancho (cm) *</Label>
                                    <Input
                                      id={`width-${group.key}-${piece.key}`}
                                      type="number"
                                      inputMode="decimal"
                                      step="0.1"
                                      value={piece.width_mm || ""}
                                      onChange={(event) =>
                                        updatePiece(group.key, piece.key, { width_mm: Number(event.target.value) })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`height-${group.key}-${piece.key}`}>Alto (cm) *</Label>
                                    <Input
                                      id={`height-${group.key}-${piece.key}`}
                                      type="number"
                                      inputMode="decimal"
                                      step="0.1"
                                      value={piece.height_mm || ""}
                                      onChange={(event) =>
                                        updatePiece(group.key, piece.key, { height_mm: Number(event.target.value) })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`qty-${group.key}-${piece.key}`}>Cantidad *</Label>
                                    <Input
                                      id={`qty-${group.key}-${piece.key}`}
                                      type="number"
                                      inputMode="numeric"
                                      value={piece.quantity || ""}
                                      onChange={(event) =>
                                        updatePiece(group.key, piece.key, { quantity: Number(event.target.value) })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor={`name-${group.key}-${piece.key}`}>Descripcion</Label>
                                    <Input
                                      id={`name-${group.key}-${piece.key}`}
                                      value={piece.name}
                                      onChange={(event) =>
                                        updatePiece(group.key, piece.key, { name: event.target.value })
                                      }
                                      placeholder="Ventanal, repisa..."
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 text-sm sm:col-span-5">
                                    <input
                                      type="checkbox"
                                      checked={piece.rotatable}
                                      onChange={(event) =>
                                        updatePiece(group.key, piece.key, { rotatable: event.target.checked })
                                      }
                                      className="h-4 w-4"
                                    />
                                    Se puede rotar
                                  </label>
                                </div>
                                {complete ? (
                                  <div className="mt-3 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setOpenPiece(null)}
                                      className="gap-1.5"
                                    >
                                      <Check className="h-4 w-4 text-success" />
                                      Listo
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}

                      <Button
                        type="button"
                        onClick={() => addPiece(group.key)}
                        className="h-12 w-full gap-2 text-sm font-semibold"
                      >
                        <Plus className="h-5 w-5" />
                        Agregar pieza en este material
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => toggleGroup(group)}
                      className="h-11 w-full gap-2 text-sm font-semibold"
                    >
                      <Check className="h-4 w-4 text-success" />
                      Listo con este material
                    </Button>
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
