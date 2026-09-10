import { beforeEach, describe, expect, it } from "vitest";
import { getRepository } from "@/lib/data";
import { resetData, DEMO_USERS } from "@/lib/data";
import { AppError } from "@/lib/errors";

const admin = DEMO_USERS[0];
const cortador = DEMO_USERS[3];

function firstProductId(): string {
  const repo = getRepository();
  return repo.listProducts().find((product) => product.internal_code === "CLA-6")!.id;
}

describe("repositorio de dominio", () => {
  beforeEach(() => {
    resetData();
  });

  it("crea pedidos con piezas trazables al preparar el corte", () => {
    const repo = getRepository();
    const productId = firstProductId();
    const order = repo.createOrder(
      {
        customer_id: null,
        due_at: null,
        reference: "Prueba",
        notes: null,
        discount_cents: 0,
        items: [
          {
            glass_product_id: productId,
            name: "Panel",
            quantity: 3,
            width_mm: 500,
            height_mm: 400,
            rotatable: true,
            notes: null,
          },
        ],
      },
      admin.id,
    );
    expect(order.status).toBe("draft");
    const pieces = repo.ensurePiecesForOrder(order.id);
    expect(pieces).toHaveLength(3);
    expect(new Set(pieces.map((piece) => piece.piece_code)).size).toBe(3);
  });

  it("rechaza transiciones de estado invalidas", () => {
    const repo = getRepository();
    const order = repo.listOrders({ status: "queued" })[0];
    expect(() => repo.transitionOrder(order.id, "completed", admin.id)).toThrow();
  });

  it("cuadra pedidos compatibles y genera layouts y operaciones", () => {
    const repo = getRepository();
    const orders = repo.listOrders({ status: "queued" });
    const job = repo.createJob(
      {
        strategy: "mixed",
        allow_rotation: true,
        order_ids: orders.map((order) => order.id),
        piece_ids: [],
        sheet_type_ids: [],
        remnant_ids: [],
        notes: null,
      },
      admin.id,
    );
    const detail = repo.getJobDetail(job.id);
    expect(detail?.layouts.length).toBeGreaterThan(0);
    expect(detail?.operations.length).toBeGreaterThan(0);
    expect(job.utilization_percent).toBeGreaterThan(0);
    expect(detail?.pieces.every((piece) => piece.cutting_job_id === job.id)).toBe(true);
  });

  it("impide cuadrar piezas de materiales incompatibles", () => {
    const repo = getRepository();
    const products = repo.listProducts();
    const claro = products.find((product) => product.internal_code === "CLA-6")!;
    const bronce = products.find((product) => product.internal_code === "BRO-6")!;
    const order = repo.createOrder(
      {
        customer_id: null,
        due_at: null,
        reference: null,
        notes: null,
        discount_cents: 0,
        items: [
          {
            glass_product_id: claro.id,
            name: null,
            quantity: 1,
            width_mm: 500,
            height_mm: 500,
            rotatable: true,
            notes: null,
          },
          {
            glass_product_id: bronce.id,
            name: null,
            quantity: 1,
            width_mm: 500,
            height_mm: 500,
            rotatable: true,
            notes: null,
          },
        ],
      },
      admin.id,
    );
    expect(() =>
      repo.createJob(
        {
          strategy: "sheets",
          allow_rotation: true,
          order_ids: [order.id],
          piece_ids: [],
          sheet_type_ids: [],
          remnant_ids: [],
          notes: null,
        },
        admin.id,
      ),
    ).toThrow(AppError);
  });

  it("reserva un retazo de forma atomica", () => {
    const repo = getRepository();
    const remnant = repo.listRemnants({ status: "available" })[0];
    const jobId = "00000000-0000-4000-8000-000000000fff";
    const reservation = repo.reserveRemnant(remnant.id, jobId, admin.id);
    expect(reservation.status).toBe("active");
    expect(() => repo.reserveRemnant(remnant.id, jobId, admin.id)).toThrow(AppError);
    const after = repo.listRemnants().find((item) => item.id === remnant.id);
    expect(after?.status).toBe("reserved");
  });

  it("libera reservas vencidas", () => {
    const repo = getRepository();
    const remnant = repo.listRemnants({ status: "available" })[0];
    const reservation = repo.reserveRemnant(remnant.id, "job-x", admin.id);
    reservation.expires_at = new Date(Date.now() - 1000).toISOString();
    const released = repo.expireReservations();
    expect(released).toBe(1);
    expect(repo.listRemnants().find((item) => item.id === remnant.id)?.status).toBe("available");
  });

  it("completa el trabajo, registra retazos y cierra pedidos", () => {
    const repo = getRepository();
    const orders = repo.listOrders({ status: "queued" });
    const job = repo.createJob(
      {
        strategy: "sheets",
        allow_rotation: true,
        order_ids: orders.map((order) => order.id),
        piece_ids: [],
        sheet_type_ids: [],
        remnant_ids: [],
        notes: null,
      },
      admin.id,
    );
    repo.startJob(job.id, cortador.id);
    const detail = repo.getJobDetail(job.id)!;
    for (const operation of detail.operations) {
      repo.completeOperation(job.id, operation.id, cortador.id);
    }
    const completed = repo.completeJob(
      job.id,
      cortador.id,
      [
        {
          glass_product_id: firstProductId(),
          width_mm: 800,
          height_mm: 400,
          quantity: 1,
          location: "Bodega A",
        },
      ],
    );
    expect(completed.status).toBe("completed");
    const remnants = repo.listRemnants().filter((remnant) => remnant.source_cutting_job_id === job.id);
    expect(remnants).toHaveLength(1);
    const closedOrders = repo.listOrders({ status: "completed" });
    expect(closedOrders.length).toBeGreaterThan(0);
  });

  it("no permite finalizar con operaciones pendientes", () => {
    const repo = getRepository();
    const orders = repo.listOrders({ status: "queued" });
    const job = repo.createJob(
      {
        strategy: "sheets",
        allow_rotation: true,
        order_ids: orders.map((order) => order.id),
        piece_ids: [],
        sheet_type_ids: [],
        remnant_ids: [],
        notes: null,
      },
      admin.id,
    );
    repo.startJob(job.id, cortador.id);
    expect(() => repo.completeJob(job.id, cortador.id, [])).toThrow(AppError);
    repo.forceCompleteJob(job.id, admin.id);
    expect(repo.getJobDetail(job.id)?.job.status).toBe("completed");
  });
});
