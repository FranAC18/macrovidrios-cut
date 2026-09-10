export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

export function formatAreaFromMm2(mm2: number): string {
  return `${((mm2 ?? 0) / 1_000_000).toFixed(2)} m²`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value ?? 0).toFixed(decimals)}%`;
}

export function formatMm(value: number): string {
  return `${value} mm`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(new Date(iso));
}

export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeZone: "America/Guayaquil",
  }).format(new Date(iso));
}

export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height} mm`;
}
