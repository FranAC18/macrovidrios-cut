"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Pause, Play, SquareStack } from "lucide-react";
import {
  completeJobAction,
  completeOperationAction,
  forceCompleteJobAction,
  pauseJobAction,
  startJobAction,
} from "@/actions/cutting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LayoutViewer, type LayoutPlacementView } from "@/components/cutting/layout-viewer";
import { formatPercent } from "@/lib/format";

export interface ProductionLayout {
  id: string;
  sequence_number: number;
  material_type: "sheet" | "remnant";
  width_mm: number;
  height_mm: number;
  utilization_percent: number;
  placements: LayoutPlacementView[];
}

export interface ProductionOperation {
  id: string;
  cutting_layout_id: string;
  sequence_number: number;
  instruction: string;
  axis: "x" | "y" | null;
  position_mm: number | null;
  cut_length_mm: number | null;
  status: string;
}

interface RemnantRow {
  key: number;
  width_mm: number;
  height_mm: number;
  quantity: number;
  location: string;
}

let rowKey = 0;

export function ProductionMode({
  job,
  layouts,
  operations,
  productId,
  productName,
  canForce,
}: {
  job: { id: string; job_number: string; status: string };
  layouts: ProductionLayout[];
  operations: ProductionOperation[];
  productId: string;
  productName: string;
  canForce: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [index, setIndex] = useState(0);
  const [showFinish, setShowFinish] = useState(false);
  const [remnants, setRemnants] = useState<RemnantRow[]>([]);

  const layoutOrder = useMemo(() => {
    const order = new Map(layouts.map((layout, position) => [layout.id, position] as const));
    return order;
  }, [layouts]);

  const orderedOperations = useMemo(
    () =>
      [...operations].sort((a, b) => {
        const layoutA = layoutOrder.get(a.cutting_layout_id) ?? 0;
        const layoutB = layoutOrder.get(b.cutting_layout_id) ?? 0;
        if (layoutA !== layoutB) return layoutA - layoutB;
        return a.sequence_number - b.sequence_number;
      }),
    [operations, layoutOrder],
  );

  const current = orderedOperations[index];
  const currentLayout = current
    ? layouts.find((layout) => layout.id === current.cutting_layout_id)
    : layouts[0];
  const completedCount = orderedOperations.filter((operation) => operation.status === "completed").length;
  const progress = orderedOperations.length
    ? Math.round((completedCount / orderedOperations.length) * 100)
    : 0;

  const markDone = () => {
    if (!current) return;
    const formData = new FormData();
    formData.set("jobId", job.id);
    formData.set("operationId", current.id);
    startTransition(async () => {
      await completeOperationAction(formData);
      setIndex((value) => Math.min(value + 1, orderedOperations.length - 1));
      router.refresh();
    });
  };

  const runAction = (action: (formData: FormData) => Promise<void>) => {
    const formData = new FormData();
    formData.set("id", job.id);
    startTransition(async () => {
      await action(formData);
      router.refresh();
    });
  };

  const submitFinish = () => {
    const formData = new FormData();
    formData.set("id", job.id);
    formData.set(
      "remnants_json",
      JSON.stringify(
        remnants
          .filter((row) => row.width_mm > 0 && row.height_mm > 0)
          .map((row) => ({
            glass_product_id: productId,
            width_mm: row.width_mm,
            height_mm: row.height_mm,
            quantity: row.quantity,
            location: row.location || null,
          })),
      ),
    );
    startTransition(async () => {
      await completeJobAction(formData);
    });
  };

  if (job.status === "optimized" || job.status === "ready") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardHeader>
          <CardTitle>Trabajo listo para cortar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {job.job_number} · {orderedOperations.length} operaciones
          </p>
          <Button size="xl" className="w-full" disabled={isPending} onClick={() => runAction(startJobAction)}>
            <Play className="h-5 w-5" />
            Iniciar corte
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (job.status === "completed" || job.status === "cancelled") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="space-y-2 py-10">
          <Check className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="text-lg font-semibold">Trabajo finalizado</p>
          <p className="text-sm text-muted-foreground">{job.job_number}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trabajo</p>
          <p className="text-xl font-bold">{job.job_number}</p>
        </div>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => runAction(pauseJobAction)}>
          <Pause className="h-4 w-4" />
          Pausar
        </Button>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium">
            Corte {Math.min(index + 1, orderedOperations.length)} de {orderedOperations.length}
          </span>
          <span className="text-muted-foreground">{progress}% completado</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {currentLayout ? (
        <LayoutViewer
          widthMm={currentLayout.width_mm}
          heightMm={currentLayout.height_mm}
          placements={currentLayout.placements}
          label={`${currentLayout.material_type === "sheet" ? "Plancha" : "Retazo"} ${currentLayout.sequence_number}`}
          utilizationPercent={currentLayout.utilization_percent}
          showLabels={false}
        />
      ) : null}

      {current ? (
        <Card className="border-primary/40">
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {current.axis === "x" ? "Corte vertical" : "Corte horizontal"}
            </p>
            <p className="text-3xl font-bold sm:text-4xl">{current.instruction}</p>
            {current.cut_length_mm ? (
              <p className="text-sm text-muted-foreground">Longitud {current.cut_length_mm} mm</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {currentLayout
                ? `${currentLayout.material_type === "sheet" ? "Plancha" : "Retazo"} · ${formatPercent(currentLayout.utilization_percent)} de uso`
                : ""}
            </p>
            <Button size="xl" className="w-full" disabled={isPending} onClick={markDone}>
              <Check className="h-5 w-5" />
              Marcar como realizado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No hay operaciones registradas.
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="lg"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={index >= orderedOperations.length - 1}
          onClick={() => setIndex((value) => Math.min(orderedOperations.length - 1, value + 1))}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Finalizar trabajo</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowFinish((value) => !value)}>
            <SquareStack className="h-4 w-4" />
            Registrar retazos
          </Button>
        </CardHeader>
        {showFinish ? (
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Si quedaron sobrantes aprovechables de {productName}, registralos aqui.
            </p>
            {remnants.map((row) => (
              <div key={row.key} className="grid gap-2 sm:grid-cols-4">
                <div>
                  <Label>Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={row.width_mm || ""}
                    onChange={(event) =>
                      setRemnants((current) =>
                        current.map((item) =>
                          item.key === row.key ? { ...item, width_mm: Number(event.target.value) } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Alto (mm)</Label>
                  <Input
                    type="number"
                    value={row.height_mm || ""}
                    onChange={(event) =>
                      setRemnants((current) =>
                        current.map((item) =>
                          item.key === row.key ? { ...item, height_mm: Number(event.target.value) } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={row.quantity}
                    onChange={(event) =>
                      setRemnants((current) =>
                        current.map((item) =>
                          item.key === row.key ? { ...item, quantity: Number(event.target.value) } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Ubicacion</Label>
                  <Input
                    value={row.location}
                    onChange={(event) =>
                      setRemnants((current) =>
                        current.map((item) =>
                          item.key === row.key ? { ...item, location: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setRemnants((current) => [
                  ...current,
                  { key: rowKey++, width_mm: 0, height_mm: 0, quantity: 1, location: "" },
                ])
              }
            >
              Agregar retazo
            </Button>
          </CardContent>
        ) : null}
        <CardContent className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            variant="default"
            disabled={isPending}
            onClick={submitFinish}
          >
            <Check className="h-4 w-4" />
            Finalizar y cerrar trabajo
          </Button>
          {canForce ? (
            <Button
              className="w-full"
              variant="outline"
              disabled={isPending}
              onClick={() => runAction(forceCompleteJobAction)}
            >
              <AlertTriangle className="h-4 w-4" />
              Forzar finalizacion (supervisor)
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
