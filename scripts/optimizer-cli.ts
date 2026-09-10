import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { optimize } from "../src/lib/optimization/optimizer";
import { sampleRequest } from "../src/lib/optimization/fixtures";
import type { OptimizationRequest } from "../src/lib/optimization/types";

function loadRequest(args: string[]): OptimizationRequest {
  const fileArg = args.find((arg) => !arg.startsWith("--"));
  if (!fileArg || fileArg === "sample") {
    return sampleRequest();
  }
  const filePath = resolve(process.cwd(), fileArg);
  return JSON.parse(readFileSync(filePath, "utf8")) as OptimizationRequest;
}

function main(): void {
  const args = process.argv.slice(2);
  const request = loadRequest(args);
  const result = optimize(request);

  const output = {
    status: result.status,
    reason: result.reason,
    utilization_percent: result.utilization_percent,
    waste_percent: result.waste_percent,
    score: result.score,
    sources: result.materials.map((material) => ({
      source_id: material.source_id,
      quantity: material.quantity,
    })),
    placements: result.placements.length,
    operations: result.operations.length,
    validation: result.validation,
    metrics: result.metrics,
    optimizer_version: result.optimizer_version,
  };

  if (args.includes("--json")) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  }

  if (result.status !== "ok") {
    process.exitCode = 1;
  }
}

main();
