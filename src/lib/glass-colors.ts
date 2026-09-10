export const GLASS_COLOR_HEX: Record<string, string> = {
  claro: "#dce9f8",
  bronce: "#a9713d",
  verde: "#2f7d5c",
  negro: "#1f2937",
  espejo: "#c7d0dc",
  gris: "#9aa3af",
  azul: "#2f6fd0",
};

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function glassColorHex(name: string | null | undefined): string {
  if (!name) return "#eef1f6";
  const key = normalize(name);
  for (const [color, hex] of Object.entries(GLASS_COLOR_HEX)) {
    if (key.includes(color)) return hex;
  }
  return "#eef1f6";
}

export function isDarkGlassColor(name: string | null | undefined): boolean {
  const hex = glassColorHex(name).replace("#", "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}
