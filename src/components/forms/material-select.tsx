"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Label, Select } from "@/components/ui/input";

export interface MaterialOption {
  id: string;
  color_id: string;
  color_name: string;
  thickness_id: string;
  thickness_mm: number;
}

function uniqueBy<T, K>(items: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(item);
  }
  return result;
}

export function MaterialSelect({
  products,
  name,
  required = false,
  defaultValue,
  mode = "form",
  onProductChange,
}: {
  products: MaterialOption[];
  name?: string;
  required?: boolean;
  defaultValue?: string;
  mode?: "form" | "filter";
  onProductChange?: (productId: string) => void;
}) {
  const initial = products.find((product) => product.id === defaultValue);
  const [colorId, setColorId] = useState(initial?.color_id ?? "");
  const [thicknessId, setThicknessId] = useState(initial?.thickness_id ?? "");
  const lastEmitted = useRef<string | undefined>(initial?.id);

  const colors = useMemo(
    () =>
      uniqueBy(products, (product) => product.color_id).map((product) => ({
        id: product.color_id,
        name: product.color_name,
      })),
    [products],
  );

  const thicknesses = useMemo(
    () =>
      uniqueBy(products, (product) => product.thickness_id)
        .map((product) => ({ id: product.thickness_id, mm: product.thickness_mm }))
        .sort((a, b) => a.mm - b.mm),
    [products],
  );

  const availableColors = thicknessId
    ? colors.filter((color) =>
        products.some(
          (product) => product.color_id === color.id && product.thickness_id === thicknessId,
        ),
      )
    : colors;

  const availableThicknesses = colorId
    ? thicknesses.filter((thickness) =>
        products.some(
          (product) => product.thickness_id === thickness.id && product.color_id === colorId,
        ),
      )
    : thicknesses;

  const selected = products.find(
    (product) => product.color_id === colorId && product.thickness_id === thicknessId,
  );

  useEffect(() => {
    const id = selected?.id ?? "";
    if (lastEmitted.current !== id) {
      lastEmitted.current = id;
      onProductChange?.(id);
    }
  }, [selected?.id, onProductChange]);

  const colorEmpty = mode === "filter" ? "Todos" : "Color";
  const thicknessEmpty = mode === "filter" ? "Todos" : "Espesor";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Color</Label>
          <Select
            value={colorId}
            aria-label="Color"
            onChange={(event) => {
              const next = event.target.value;
              setColorId(next);
              if (
                thicknessId &&
                !products.some((product) => product.color_id === next && product.thickness_id === thicknessId)
              ) {
                setThicknessId("");
              }
            }}
          >
            <option value="">{colorEmpty}</option>
            {availableColors.map((color) => (
              <option key={color.id} value={color.id}>
                {color.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Espesor</Label>
          <Select
            value={thicknessId}
            aria-label="Espesor"
            onChange={(event) => {
              const next = event.target.value;
              setThicknessId(next);
              if (
                colorId &&
                !products.some((product) => product.thickness_id === next && product.color_id === colorId)
              ) {
                setColorId("");
              }
            }}
          >
            <option value="">{thicknessEmpty}</option>
            {availableThicknesses.map((thickness) => (
              <option key={thickness.id} value={thickness.id}>
                {thickness.mm} mm
              </option>
            ))}
          </Select>
        </div>
      </div>
      {name ? <input type="hidden" name={name} value={selected?.id ?? ""} required={required} /> : null}
      {colorId && thicknessId && !selected ? (
        <p className="text-xs font-medium text-destructive">Esa combinacion de color y espesor no esta disponible.</p>
      ) : null}
    </div>
  );
}
