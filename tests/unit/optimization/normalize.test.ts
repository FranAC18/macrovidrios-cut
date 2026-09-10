import { describe, expect, it } from "vitest";
import { rectContains, rectsOverlap, toMm } from "@/lib/optimization/geometry";
import { expandQuantity, normalizeRequest } from "@/lib/optimization/normalize";
import { piece, repeatPiece, sampleRequest } from "@/lib/optimization/fixtures";

describe("geometry", () => {
  it("detecta superposicion", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 50, y: 50, width: 100, height: 100 },
      ),
    ).toBe(true);
  });

  it("no marca superposicion en bordes contiguos", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 100, y: 0, width: 100, height: 100 },
      ),
    ).toBe(false);
  });

  it("valida contencion", () => {
    expect(
      rectContains(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 10, y: 10, width: 80, height: 80 },
      ),
    ).toBe(true);
    expect(
      rectContains(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 10, y: 10, width: 95, height: 80 },
      ),
    ).toBe(false);
  });

  it("redondea medidas a mm", () => {
    expect(toMm(10.4)).toBe(10);
    expect(toMm(10.6)).toBe(11);
  });
});

describe("normalize", () => {
  it("expande cantidades a piezas trazables", () => {
    const expanded = expandQuantity(
      {
        order_id: "MV-1",
        width_mm: 100,
        height_mm: 200,
        rotatable: true,
        material_id: "claro-6mm",
      },
      3,
      (index) => `p-${index}`,
    );
    expect(expanded).toHaveLength(3);
    expect(expanded.map((p) => p.piece_id)).toEqual(["p-0", "p-1", "p-2"]);
  });

  it("rechaza ids duplicados sin romper el resto", () => {
    const request = sampleRequest({
      pieces: [piece("dup", 100, 100), piece("dup", 200, 200), piece("ok", 300, 300)],
    });
    const normalized = normalizeRequest(request);
    expect(normalized.pieces).toHaveLength(2);
    expect(normalized.issues.some((issue) => issue.includes("repetida"))).toBe(true);
  });

  it("calcula area total de piezas", () => {
    const pieces = repeatPiece("x", 100, 200, 4);
    const normalized = normalizeRequest(sampleRequest({ pieces }));
    expect(normalized.total_piece_area_mm2).toBe(100 * 200 * 4);
  });
});
