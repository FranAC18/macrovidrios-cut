"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createColorAction,
  createProductAction,
  createThicknessAction,
  type CatalogActionState,
} from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import type { GlassColor, GlassThickness } from "@/types/domain";

const initialState: CatalogActionState = {};

function Feedback({ state }: { state: CatalogActionState }) {
  if (state.error) return <FieldError>{state.error}</FieldError>;
  if (state.ok) return <p className="text-sm text-emerald-700">Guardado correctamente.</p>;
  return null;
}

export function ColorForm() {
  const [state, formAction, pending] = useActionState(createColorAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);
  return (
    <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input name="name" placeholder="Claro" required />
      </div>
      <div className="space-y-1">
        <Label>Codigo</Label>
        <Input name="code" placeholder="CLA" required />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          Agregar color
        </Button>
      </div>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function ThicknessForm() {
  const [state, formAction, pending] = useActionState(createThicknessAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);
  return (
    <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label>Espesor (mm)</Label>
        <Input name="thickness_mm" type="number" placeholder="6" required />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          Agregar espesor
        </Button>
      </div>
      <div className="sm:col-span-2">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function ProductForm({
  colors,
  thicknesses,
}: {
  colors: GlassColor[];
  thicknesses: GlassThickness[];
}) {
  const [state, formAction, pending] = useActionState(createProductAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);
  return (
    <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div className="space-y-1">
        <Label>Color</Label>
        <Select name="color_id" required defaultValue="">
          <option value="" disabled>
            Color
          </option>
          {colors.map((color) => (
            <option key={color.id} value={color.id}>
              {color.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Espesor</Label>
        <Select name="thickness_id" required defaultValue="">
          <option value="" disabled>
            Espesor
          </option>
          {thicknesses.map((thickness) => (
            <option key={thickness.id} value={thickness.id}>
              {thickness.thickness_mm} mm
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input name="name" placeholder="Claro 6 mm" required />
      </div>
      <div className="space-y-1">
        <Label>Codigo interno</Label>
        <Input name="internal_code" placeholder="CLA-6" required />
      </div>
      <div className="space-y-1">
        <Label>Kerf (mm)</Label>
        <Input name="default_kerf_mm" type="number" defaultValue={3} />
      </div>
      <div className="space-y-1">
        <Label>Margen (mm)</Label>
        <Input name="default_margin_mm" type="number" defaultValue={10} />
      </div>
      <div className="space-y-1">
        <Label>Separacion (mm)</Label>
        <Input name="default_separation_mm" type="number" defaultValue={0} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          Agregar material
        </Button>
      </div>
      <div className="sm:col-span-4">
        <Feedback state={state} />
      </div>
    </form>
  );
}
