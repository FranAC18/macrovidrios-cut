import { glassColorHex, isDarkGlassColor } from "@/lib/glass-colors";
import { cn } from "@/lib/utils";

export function MaterialSwatch({
  colorName,
  className,
}: {
  colorName?: string | null;
  className?: string;
}) {
  const hex = glassColorHex(colorName);
  const dark = isDarkGlassColor(colorName);
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-lg border shadow-sm",
        dark ? "border-black/30" : "border-border",
        className ?? "h-10 w-10",
      )}
      style={{ backgroundColor: hex }}
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10" />
    </span>
  );
}
