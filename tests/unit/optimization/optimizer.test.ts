import { describe, expect, it } from "vitest";
import { optimize } from "@/lib/optimization/optimizer";
import {
  DEVELOPMENT_MATERIAL,
  piece,
  repeatPiece,
  sampleRequest,
} from "@/lib/optimization/fixtures";
import { rectContains, rectsOverlap } from "@/lib/optimization/geometry";
import type { OptimizationRequest, SheetSource } from "@/lib/optimization/types";

const sheet = (width: number, height: number, id = "s1"): SheetSource => ({
  kind: "sheet",
  source_id: id,
  width_mm: width,
  height_mm: height,
  unit_cost_cents: 100000,
});

function base(overrides: Partial<OptimizationRequest> = {}): OptimizationRequest {
  return {
    request_version: "1.0",
    pieces: [],
    material: DEVELOPMENT_MATERIAL,
    sources: { sheets: [sheet(3210, 2140)], remnants: [] },
    constraints: { allow_rotation: true, allow_sheets: true, allow_remnants: true },
    objective_weights: { efficiency: 70, cut_ease: 20, operation_count: 10 },
    random_seed: 7,
    optimizer_version: "test",
    configuration_version: "test-1",
    strategy: "sheets",
    ...overrides,
  };
}

describe("optimizador rectangular", () => {
  it("caso 1: una sola pieza", () => {
    const result = optimize(base({ pieces: [piece("p1", 800, 600)] }));
    expect(result.status).toBe("ok");
    expect(result.placements).toHaveLength(1);
    expect(result.validation.valid).toBe(true);
  });

  it("caso 2: multiples rectangulos todos asignados", () => {
    const pieces = [
      ...repeatPiece("a", 1200, 800, 2),
      ...repeatPiece("b", 900, 600, 2),
      ...repeatPiece("c", 600, 400, 4),
    ];
    const result = optimize(base({ pieces }));
    expect(result.status).toBe("ok");
    expect(result.placements).toHaveLength(8);
    expect(new Set(result.placements.map((p) => p.piece_id)).size).toBe(8);
  });

  it("caso 3: pieza que solo cabe rotada", () => {
    const result = optimize(
      base({ pieces: [piece("rot", 1900, 900, { rotatable: true })], sources: { sheets: [sheet(1000, 2000)], remnants: [] } }),
    );
    expect(result.status).toBe("ok");
    expect(result.placements[0].rotation_deg).toBe(90);
  });

  it("caso 4: pieza imposible no se reporta como completa", () => {
    const result = optimize(base({ pieces: [piece("big", 5000, 5000)] }));
    expect(result.status).toBe("infeasible");
    expect(result.placements).toHaveLength(0);
    expect(result.reason).toContain("no caben");
  });

  it("caso 5: varias planchas", () => {
    const pieces = repeatPiece("p", 400, 400, 8);
    const result = optimize(
      base({ pieces, sources: { sheets: [sheet(1000, 1000)], remnants: [] } }),
    );
    expect(result.status).toBe("ok");
    expect(result.materials[0].quantity).toBeGreaterThanOrEqual(2);
  });

  it("caso 6: retazo util se aprovecha", () => {
    const result = optimize(
      base({
        pieces: [piece("p1", 1000, 500)],
        sources: {
          sheets: [],
          remnants: [
            { kind: "remnant", source_id: "r1", width_mm: 1200, height_mm: 750, cost_cents: 5000, shape: "rectangle", quantity: 1 },
          ],
        },
        strategy: "remnants",
      }),
    );
    expect(result.status).toBe("ok");
    expect(result.placements[0].source_id.startsWith("r1")).toBe(true);
  });

  it("caso 7: retazo incompatible es infactible", () => {
    const result = optimize(
      base({
        pieces: [piece("p1", 1300, 700)],
        sources: {
          sheets: [],
          remnants: [
            { kind: "remnant", source_id: "r1", width_mm: 1200, height_mm: 750, cost_cents: 5000, shape: "rectangle", quantity: 1 },
          ],
        },
        strategy: "remnants",
      }),
    );
    expect(result.status).toBe("infeasible");
  });

  it("caso 8: mezcla de pedidos conserva trazabilidad", () => {
    const result = optimize(sampleRequest());
    expect(result.status).toBe("ok");
    const orders = new Set(result.placements.map((p) => p.order_id));
    expect(orders.has("MV-00231")).toBe(true);
    expect(orders.has("MV-00234")).toBe(true);
  });

  it("caso 9: respeta margen y separacion", () => {
    const result = optimize(
      base({
        material: { ...DEVELOPMENT_MATERIAL, margin_mm: 10, separation_mm: 5 },
        pieces: repeatPiece("p", 700, 500, 4),
      }),
    );
    expect(result.status).toBe("ok");
    for (const placement of result.placements) {
      expect(
        rectContains(
          { x: 10, y: 10, width: 3210 - 20, height: 2140 - 20 },
          { x: placement.x_mm, y: placement.y_mm, width: placement.width_mm, height: placement.height_mm },
        ),
      ).toBe(true);
    }
    expect(result.validation.valid).toBe(true);
  });

  it("caso 10: orientacion bloqueada es infactible", () => {
    const result = optimize(
      base({
        pieces: [piece("rot", 1900, 900, { rotatable: false })],
        sources: { sheets: [sheet(1000, 2000)], remnants: [] },
      }),
    );
    expect(result.status).toBe("infeasible");
  });

  it("caso 11: mismo input produce el mismo resultado", () => {
    const request = sampleRequest();
    const first = optimize(request);
    const second = optimize(request);
    const stripTiming = (result: typeof first) => ({
      ...result,
      metrics: { ...result.metrics, duration_ms: 0 },
    });
    expect(stripTiming(first)).toEqual(stripTiming(second));
  });

  it("caso 12: operaciones reproducibles y referencian areas existentes", () => {
    const result = optimize(sampleRequest());
    const areaIds = new Set(result.areas.map((area) => area.area_id));
    result.operations.forEach((operation, index) => {
      expect(operation.sequence).toBe(index + 1);
      expect(areaIds.has(operation.area_id)).toBe(true);
      expect(operation.length_mm).toBeGreaterThan(0);
    });
  });

  it("invariante: no hay piezas superpuestas", () => {
    const result = optimize(sampleRequest());
    const bySource = new Map<string, typeof result.placements>();
    for (const placement of result.placements) {
      const list = bySource.get(placement.source_id) ?? [];
      list.push(placement);
      bySource.set(placement.source_id, list);
    }
    for (const list of bySource.values()) {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          expect(
            rectsOverlap(
              { x: list[i].x_mm, y: list[i].y_mm, width: list[i].width_mm, height: list[i].height_mm },
              { x: list[j].x_mm, y: list[j].y_mm, width: list[j].width_mm, height: list[j].height_mm },
            ),
          ).toBe(false);
        }
      }
    }
  });

  it("invariante: areas y porcentajes son consistentes", () => {
    const result = optimize(sampleRequest());
    expect(result.utilization_percent + result.waste_percent).toBeCloseTo(100, 1);
    expect(result.used_area_mm2 + result.waste_area_mm2).toBe(result.source_area_mm2);
  });
});
