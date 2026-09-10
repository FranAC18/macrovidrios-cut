"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { MaterialSelect } from "@/components/forms/material-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { ProductView } from "@/lib/data";

const STATUS_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "consumed", label: "Utilizado" },
  { value: "discarded", label: "Descartado" },
];

export function RemnantFilters({
  products,
  current,
}: {
  products: ProductView[];
  current: { product?: string; min_width?: string; min_height?: string; status?: string };
}) {
  return (
    <form className="panel p-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-1.5">
          <Label>Material</Label>
          <MaterialSelect
            products={products}
            name="product"
            mode="filter"
            defaultValue={current.product}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="min_width">Ancho minimo (cm)</Label>
          <Input
            id="min_width"
            name="min_width"
            type="number"
            step="0.1"
            inputMode="decimal"
            defaultValue={current.min_width}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="min_height">Alto minimo (cm)</Label>
          <Input
            id="min_height"
            name="min_height"
            type="number"
            step="0.1"
            inputMode="decimal"
            defaultValue={current.min_height}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <Select id="status" name="status" defaultValue={current.status ?? ""}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" className="w-full sm:w-auto">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>
        <Link href="/retazos" className={buttonVariants({ variant: "ghost", className: "w-full sm:w-auto" })}>
          Limpiar
        </Link>
      </div>
    </form>
  );
}
