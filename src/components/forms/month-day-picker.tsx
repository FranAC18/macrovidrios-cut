"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ITEM_HEIGHT = 40;
const HEIGHT = 200;

interface WheelItem {
  value: number;
  label: string;
}

function WheelColumn({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: WheelItem[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToValue = (target: number, smooth: boolean) => {
    const index = items.findIndex((item) => item.value === target);
    if (index < 0 || !ref.current) return;
    ref.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToValue(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const node = ref.current;
      if (!node) return;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(node.scrollTop / ITEM_HEIGHT)));
      const item = items[index];
      if (item && item.value !== value) onChange(item.value);
    }, 90);
  };

  return (
    <div className="relative" style={{ height: HEIGHT }}>
      <div className="pointer-events-none absolute inset-x-2 top-1/2 z-0 h-10 -translate-y-1/2 rounded-lg bg-accent" />
      <div
        ref={ref}
        onScroll={handleScroll}
        role="listbox"
        aria-label={ariaLabel}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll"
        style={{ paddingTop: HEIGHT / 2 - ITEM_HEIGHT / 2, paddingBottom: HEIGHT / 2 - ITEM_HEIGHT / 2 }}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                onChange(item.value);
                scrollToValue(item.value, true);
              }}
              className={cn(
                "flex h-10 w-full snap-center items-center justify-center transition-all",
                active ? "text-base font-bold text-foreground" : "text-sm text-muted-foreground/70",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthDayPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const today = new Date();
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  const initialMonth = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getMonth() : today.getMonth();
  const initialDay = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getDate() : today.getDate();

  const monthItems = MONTHS.map((label, index) => ({ value: index, label }));
  const month = initialMonth;
  const daysInMonth = new Date(today.getFullYear(), month + 1, 0).getDate();
  const dayItems = Array.from({ length: daysInMonth }, (_, index) => ({
    value: index + 1,
    label: String(index + 1).padStart(2, "0"),
  }));
  const day = Math.min(initialDay, daysInMonth);

  const year =
    month > today.getMonth() || (month === today.getMonth() && day >= today.getDate())
      ? today.getFullYear()
      : today.getFullYear() + 1;

  const emit = (nextMonth: number, nextDay: number) => {
    const maxDay = new Date(today.getFullYear(), nextMonth + 1, 0).getDate();
    const safeDay = Math.min(nextDay, maxDay);
    const nextYear =
      nextMonth > today.getMonth() || (nextMonth === today.getMonth() && safeDay >= today.getDate())
        ? today.getFullYear()
        : today.getFullYear() + 1;
    const iso = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    onChange(iso);
  };

  // Emite el valor inicial una vez para que coincida con lo mostrado.
  useEffect(() => {
    emit(initialMonth, Math.min(initialDay, new Date(today.getFullYear(), initialMonth + 1, 0).getDate()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2">
        <WheelColumn
          items={monthItems}
          value={month}
          onChange={(nextMonth) => emit(nextMonth, day)}
          ariaLabel="Mes"
        />
        <WheelColumn
          items={dayItems}
          value={day}
          onChange={(nextDay) => emit(month, nextDay)}
          ariaLabel="Dia"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Año {year} (calculado automaticamente)
      </p>
    </div>
  );
}
