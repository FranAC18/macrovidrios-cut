"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const MEASUREMENT_MIN_CM = 1;
export const MEASUREMENT_MAX_CM = 600;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function MeasurementInput({
  id,
  value,
  onChange,
  min = MEASUREMENT_MIN_CM,
  max = MEASUREMENT_MAX_CM,
  step = 0.5,
  unit = "cm",
  disabled,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const outOfRange = value > 0 && (value < min || value > max);
  const text = value > 0 ? String(round(value)) : "";

  const stepBy = (delta: number) => {
    const base = value > 0 ? value : 0;
    onChange(clamp(round(base + delta), min, max));
  };

  const handleText = (raw: string) => {
    if (raw === "") {
      onChange(0);
      return;
    }
    const parsed = Number(raw.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0) return;
    onChange(round(parsed));
  };

  const normalize = () => {
    if (value <= 0) {
      onChange(0);
      return;
    }
    onChange(clamp(round(value), min, max));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => stepBy(-1)}
          disabled={disabled || value <= min}
          aria-label="Disminuir"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={text}
            disabled={disabled}
            onChange={(event) => handleText(event.target.value)}
            onKeyDown={(event) => {
              if (["-", "e", "E", "+"].includes(event.key)) event.preventDefault();
            }}
            onBlur={normalize}
            placeholder="0"
            className={cn(
              "h-11 w-full rounded-md border bg-card px-3 pr-10 text-center text-sm font-semibold tabular-nums shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              outOfRange
                ? "border-destructive focus-visible:border-destructive"
                : "border-input focus-visible:border-primary",
            )}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        </div>
        <button
          type="button"
          onClick={() => stepBy(1)}
          disabled={disabled || value >= max}
          aria-label="Aumentar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {outOfRange ? (
        <p className="text-xs font-medium text-destructive">
          La medida debe estar entre {min} y {max} {unit}.
        </p>
      ) : null}
    </div>
  );
}
