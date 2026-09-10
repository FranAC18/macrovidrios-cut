import type { Mm } from "./types";

export interface Rect {
  x: Mm;
  y: Mm;
  width: Mm;
  height: Mm;
}

export function rectArea(rect: Rect): number {
  return rect.width * rect.height;
}

export function rectRight(rect: Rect): Mm {
  return rect.x + rect.width;
}

export function rectBottom(rect: Rect): Mm {
  return rect.y + rect.height;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < rectRight(b) && rectRight(a) > b.x && a.y < rectBottom(b) && rectBottom(a) > b.y
  );
}

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    rectRight(inner) <= rectRight(outer) &&
    rectBottom(inner) <= rectBottom(outer)
  );
}

export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function toMm(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Medida invalida: ${String(value)}`);
  }
  return Math.round(value);
}

export function formatMm(value: Mm): string {
  return `${value} mm`;
}
