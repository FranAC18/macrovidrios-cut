"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import { createJobAction, type CuttingActionState } from "@/actions/cutting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDimensions } from "@/lib/format";

export interface WizardPiece {
  id: string;
  code: string;
  width_mm: number;
  height_mm: number;
  rotatable: boolean;
  product_id: string;
  product_name: string;
}

export interface WizardOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  pieces: WizardPiece[];
}

export interface SheetOption {
  id: string;
  name: string;
  width_mm: number;
  height_mm: number;
  product_id: string;
}

export interface RemnantOption {
  id: string;
  width_mm: number;
  height_mm: number;
  product_id: string;
  product_name: string;
}

const initialState: CuttingActionState = {};

export function CuttingWizard({
  orders,
  sheetOptions,
  remnantOptions,
  preselectedOrderId,
}: {
  orders: WizardOrder[];
  sheetOptions: SheetOption[];
  remnantOptions: RemnantOption[];
  preselectedOrderId?: string;
}) {
  const [state, formAction, pending] = useActionState(createJobAction, initialState);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>(
    preselectedOrderId ? [preselectedOrderId] : [],
  );
  const [selectedPieces, setSelectedPieces] = useState<string[]>(() => {
    const order = orders.find((item) => item.id === preselectedOrderId);
    return order ? order.pieces.map((piece) => piece.id) : [];
  });
  const [strategy, setStrategy] = useState<"sheets" | "remnants" | "mixed">("mixed");
  const [allowRotation, setAllowRotation] = useState(true);
  const [sheetTypes, setSheetTypes] = useState<string[]>([]);
  const [remnantIds, setRemnantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (state.error) setStep(3);
  }, [state.error]);

  const allPieces = useMemo(() => orders.flatMap((order) => order.pieces), [orders]);
  const selectedPieceObjects = allPieces.filter((piece) => selectedPieces.includes(piece.id));
  const productIds = Array.from(new Set(selectedPieceObjects.map((piece) => piece.product_id)));
  const singleProduct = productIds.length === 1 ? productIds[0] : null;
  const hasMixed = productIds.length > 1;

  const filteredSheetOptions = sheetOptions.filter(
    (option) => !singleProduct || option.product_id === singleProduct,
  );
  const filteredRemnantOptions = remnantOptions.filter(
    (option) => !singleProduct || option.product_id === singleProduct,
  );

  const toggleOrder = (order: WizardOrder) => {
    setSelectedOrders((current) => {
      const isSelected = current.includes(order.id);
      if (isSelected) {
        setSelectedPieces((pieces) => pieces.filter((id) => !order.pieces.some((p) => p.id === id)));
        return current.filter((id) => id !== order.id);
      }
      setSelectedPieces((pieces) => [...new Set([...pieces, ...order.pieces.map((p) => p.id)])]);
      return [...current, order.id];
    });
  };

  const togglePiece = (piece: WizardPiece) => {
    setSelectedPieces((current) =>
      current.includes(piece.id) ? current.filter((id) => id !== piece.id) : [...current, piece.id],
    );
  };

  const canContinue = step === 1 ? selectedPieces.length > 0 && !hasMixed : true;

  const payload = {
    strategy,
    allow_rotation: allowRotation,
    order_ids: selectedOrders,
    piece_ids: selectedPieces,
    sheet_type_ids: strategy === "remnants" ? [] : sheetTypes,
    remnant_ids: strategy === "sheets" ? [] : remnantIds,
    notes: notes || null,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ol className="mb-6 flex items-center gap-2 text-sm">
        {[1, 2, 3].map((value) => (
          <li key={value} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                step >= value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              {step > value ? <Check className="h-4 w-4" /> : value}
            </span>
            <span className={cn("hidden sm:inline", step >= value ? "font-medium" : "text-muted-foreground")}>
              {value === 1 ? "Pedidos y piezas" : value === 2 ? "Fuente de material" : "Confirmar"}
            </span>
            {value < 3 ? <span className="mx-1 h-px flex-1 bg-border" /> : null}
          </li>
        ))}
      </ol>

      <form action={formAction}>
        <input type="hidden" name="payload" value={JSON.stringify(payload)} />

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Selecciona pedidos y piezas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay pedidos pendientes. Crea un pedido para cuadrar.
                </p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-md border border-border p-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrder(order)}
                      />
                      <span className="font-medium">{order.order_number}</span>
                      <span className="text-sm text-muted-foreground">{order.customer_name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {order.pieces.length} piezas
                      </span>
                    </label>
                    {selectedOrders.includes(order.id) ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {order.pieces.map((piece) => (
                          <label
                            key={piece.id}
                            className={cn(
                              "flex items-center gap-2 rounded-md border p-2 text-sm",
                              selectedPieces.includes(piece.id) ? "border-primary bg-accent" : "border-border",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selectedPieces.includes(piece.id)}
                              onChange={() => togglePiece(piece)}
                            />
                            <span className="font-mono text-xs">{piece.code}</span>
                            <span className="text-muted-foreground">
                              {formatDimensions(piece.width_mm, piece.height_mm)}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">{piece.product_name}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
              {hasMixed ? (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Las piezas seleccionadas usan materiales distintos. Un cuadre solo admite un color y espesor.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>Fuente de material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { value: "sheets", label: "Planchas", hint: "Solo planchas nuevas" },
                    { value: "remnants", label: "Retazos", hint: "Solo sobrantes" },
                    { value: "mixed", label: "Planchas + retazos", hint: "Mejor combinacion" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStrategy(option.value)}
                    className={cn(
                      "rounded-md border p-3 text-left",
                      strategy === option.value ? "border-primary bg-accent" : "border-border",
                    )}
                  >
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.hint}</p>
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allowRotation}
                  onChange={(event) => setAllowRotation(event.target.checked)}
                />
                Permitir rotar piezas
              </label>

              {strategy !== "remnants" ? (
                <div>
                  <Label>Formatos de plancha disponibles</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {filteredSheetOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay planchas disponibles de este material.
                      </p>
                    ) : (
                      filteredSheetOptions.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={sheetTypes.includes(option.id)}
                            onChange={() =>
                              setSheetTypes((current) =>
                                current.includes(option.id)
                                  ? current.filter((id) => id !== option.id)
                                  : [...current, option.id],
                              )
                            }
                          />
                          <span className="font-medium">{option.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatDimensions(option.width_mm, option.height_mm)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Si no seleccionas ninguna, se usaran todas las disponibles.
                  </p>
                </div>
              ) : null}

              {strategy !== "sheets" ? (
                <div>
                  <Label>Retazos disponibles</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {filteredRemnantOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay retazos compatibles.</p>
                    ) : (
                      filteredRemnantOptions.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={remnantIds.includes(option.id)}
                            onChange={() =>
                              setRemnantIds((current) =>
                                current.includes(option.id)
                                  ? current.filter((id) => id !== option.id)
                                  : [...current, option.id],
                              )
                            }
                          />
                          <span className="font-medium">{option.product_name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatDimensions(option.width_mm, option.height_mm)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Si no seleccionas ninguno, se usaran todos los disponibles.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas del trabajo</Label>
                <Textarea id="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card>
            <CardHeader>
              <CardTitle>Confirmar cuadre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pedidos</span>
                <span className="font-medium">{selectedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Piezas</span>
                <span className="font-medium">{selectedPieces.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material</span>
                <span className="font-medium">
                  {selectedPieceObjects[0]?.product_name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estrategia</span>
                <span className="font-medium">
                  {strategy === "sheets" ? "Solo planchas" : strategy === "remnants" ? "Solo retazos" : "Planchas + retazos"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rotacion</span>
                <span className="font-medium">{allowRotation ? "Permitida" : "Bloqueada"}</span>
              </div>
              <FieldError>{state.error}</FieldError>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              event.preventDefault();
              setStep((current) => Math.max(1, current - 1));
            }}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Atras
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                setStep((current) => current + 1);
              }}
              disabled={!canContinue}
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={pending || selectedPieces.length === 0}>
              <Scissors className="h-4 w-4" />
              {pending ? "Cuadrando..." : "Cuadrar vidrio"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
