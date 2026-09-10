import type { PackedBin, TreeNode } from "./placement";
import type { CuttingArea, CuttingOperation } from "./types";

export interface GuillotineOutput {
  operations: CuttingOperation[];
  areas: CuttingArea[];
}

function describeCut(node: TreeNode): string {
  const axisLabel = node.split_axis === "x" ? "vertical" : "horizontal";
  const position = node.split_position ?? 0;
  const cm = Math.round((position / 10) * 10) / 10;
  const value = Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  return `Cortar ${axisLabel} a ${value} cm`;
}

function areaTypeOf(node: TreeNode, isRoot: boolean): CuttingArea["area_type"] {
  if (node.kind === "piece") return "piece";
  if (isRoot) return "source";
  return "waste";
}

export function buildGuillotine(bins: PackedBin[]): GuillotineOutput {
  const operations: CuttingOperation[] = [];
  const areas: CuttingArea[] = [];
  let sequence = 0;

  const walk = (node: TreeNode, parentId: string | null, sourceId: string, isRoot: boolean) => {
    areas.push({
      area_id: node.id,
      parent_area_id: parentId,
      source_id: sourceId,
      x_mm: node.x,
      y_mm: node.y,
      width_mm: node.width,
      height_mm: node.height,
      area_type: areaTypeOf(node, isRoot),
      piece_id: node.piece_id,
    });

    if (node.kind === "split" && node.split_axis && node.split_position !== null) {
      sequence += 1;
      operations.push({
        sequence,
        type: "cut",
        area_id: node.id,
        source_id: sourceId,
        axis: node.split_axis,
        position_mm: node.split_position,
        length_mm: node.split_axis === "x" ? node.height : node.width,
        instruction: describeCut(node),
      });
    }

    for (const child of node.children) {
      walk(child, node.id, sourceId, false);
    }
  };

  for (const bin of bins) {
    walk(bin.root, null, bin.instance_id, true);
  }

  return { operations, areas };
}
