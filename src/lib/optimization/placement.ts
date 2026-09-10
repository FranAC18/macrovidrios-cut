import type { NormalizedPiece, NormalizedSource } from "./normalize";
import type { Placement } from "./types";

export type TreeNodeKind = "free" | "piece" | "split" | "waste";

export interface TreeNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: TreeNodeKind;
  piece_id: string | null;
  order_id: string | null;
  rotation_deg: 0 | 90;
  piece_x: number;
  piece_y: number;
  piece_width: number;
  piece_height: number;
  split_axis: "x" | "y" | null;
  split_position: number | null;
  children: TreeNode[];
}

export interface PackedBin {
  instance_id: string;
  source: NormalizedSource;
  root: TreeNode;
  freeNodes: TreeNode[];
  placements: Placement[];
  used_area_mm2: number;
  cost_cents: number;
}

export interface PackOptions {
  allowRotation: boolean;
  strategy: "sheets" | "remnants" | "mixed";
  maxSources?: number;
  pieceOrder: (a: NormalizedPiece, b: NormalizedPiece) => number;
}

export interface PackOutcome {
  bins: PackedBin[];
  unplaced: NormalizedPiece[];
}

let nodeCounter = 0;
let instanceCounter = 0;

export function resetNodeCounter(): void {
  nodeCounter = 0;
  instanceCounter = 0;
}

function nextNodeId(prefix: string): string {
  nodeCounter += 1;
  return `${prefix}-n${nodeCounter}`;
}

function makeFreeNode(
  x: number,
  y: number,
  width: number,
  height: number,
): TreeNode {
  return {
    id: nextNodeId("free"),
    x,
    y,
    width,
    height,
    kind: "free",
    piece_id: null,
    order_id: null,
    rotation_deg: 0,
    piece_x: x,
    piece_y: y,
    piece_width: 0,
    piece_height: 0,
    split_axis: null,
    split_position: null,
    children: [],
  };
}

function makePieceNode(
  region: { x: number; y: number; width: number; height: number },
  piece: NormalizedPiece,
  pieceX: number,
  pieceY: number,
  pieceWidth: number,
  pieceHeight: number,
  rotation: 0 | 90,
): TreeNode {
  return {
    id: nextNodeId("piece"),
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    kind: "piece",
    piece_id: piece.piece_id,
    order_id: piece.order_id,
    rotation_deg: rotation,
    piece_x: pieceX,
    piece_y: pieceY,
    piece_width: pieceWidth,
    piece_height: pieceHeight,
    split_axis: null,
    split_position: null,
    children: [],
  };
}

function makeSplitNode(
  region: { x: number; y: number; width: number; height: number },
  axis: "x" | "y",
  position: number,
  children: TreeNode[],
): TreeNode {
  return {
    id: nextNodeId("split"),
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    kind: "split",
    piece_id: null,
    order_id: null,
    rotation_deg: 0,
    piece_x: region.x,
    piece_y: region.y,
    piece_width: 0,
    piece_height: 0,
    split_axis: axis,
    split_position: position,
    children,
  };
}

interface Orientation {
  width: number;
  height: number;
  rotation: 0 | 90;
}

function orientationsFor(piece: NormalizedPiece, allowRotation: boolean): Orientation[] {
  const base: Orientation = { width: piece.width_mm, height: piece.height_mm, rotation: 0 };
  if (!allowRotation || !piece.rotatable || piece.width_mm === piece.height_mm) {
    return [base];
  }
  return [base, { width: piece.height_mm, height: piece.width_mm, rotation: 90 }];
}

function fits(node: TreeNode, width: number, height: number): boolean {
  return width <= node.width && height <= node.height;
}

export function splitNodeForPiece(
  node: TreeNode,
  piece: NormalizedPiece,
  orientation: Orientation,
  kerf: number,
): TreeNode {
  const pw = orientation.width;
  const ph = orientation.height;
  const region = { x: node.x, y: node.y, width: node.width, height: node.height };
  const canRight = node.width - pw - kerf > 0;
  const canBottom = node.height - ph - kerf > 0;
  const pieceNode = makePieceNode(region, piece, node.x, node.y, pw, ph, orientation.rotation);

  if (!canRight && !canBottom) {
    pieceNode.width = Math.max(pw, Math.min(node.width, pw));
    pieceNode.height = Math.max(ph, Math.min(node.height, ph));
    return pieceNode;
  }

  if (canRight && !canBottom) {
    const leftWidth = pw + kerf;
    const left = makePieceNode(
      { x: node.x, y: node.y, width: leftWidth, height: node.height },
      piece,
      node.x,
      node.y,
      pw,
      ph,
      orientation.rotation,
    );
    const right = makeFreeNode(node.x + leftWidth, node.y, node.width - leftWidth, node.height);
    return makeSplitNode(region, "x", node.x + leftWidth, [left, right]);
  }

  if (!canRight && canBottom) {
    const topHeight = ph + kerf;
    const top = makePieceNode(
      { x: node.x, y: node.y, width: node.width, height: topHeight },
      piece,
      node.x,
      node.y,
      pw,
      ph,
      orientation.rotation,
    );
    const bottom = makeFreeNode(node.x, node.y + topHeight, node.width, node.height - topHeight);
    return makeSplitNode(region, "y", node.y + topHeight, [top, bottom]);
  }

  const leftWidth = pw + kerf;
  const topHeight = ph + kerf;
  const topLeft = makePieceNode(
    { x: node.x, y: node.y, width: leftWidth, height: topHeight },
    piece,
    node.x,
    node.y,
    pw,
    ph,
    orientation.rotation,
  );
  const bottomLeft = makeFreeNode(
    node.x,
    node.y + topHeight,
    leftWidth,
    node.height - topHeight,
  );
  const left = makeSplitNode(
    { x: node.x, y: node.y, width: leftWidth, height: node.height },
    "y",
    node.y + topHeight,
    [topLeft, bottomLeft],
  );
  const right = makeFreeNode(node.x + leftWidth, node.y, node.width - leftWidth, node.height);
  return makeSplitNode(region, "x", node.x + leftWidth, [left, right]);
}

function collectFreeNodes(node: TreeNode, acc: TreeNode[]): void {
  if (node.kind === "free") {
    acc.push(node);
    return;
  }
  for (const child of node.children) {
    collectFreeNodes(child, acc);
  }
}

function shortSideFit(node: TreeNode, width: number, height: number): [number, number] {
  const leftoverWidth = node.width - width;
  const leftoverHeight = node.height - height;
  return [Math.min(leftoverWidth, leftoverHeight), Math.max(leftoverWidth, leftoverHeight)];
}

function isBetterFit(
  candidate: [number, number],
  current: [number, number] | null,
): boolean {
  if (!current) return true;
  if (candidate[0] !== current[0]) return candidate[0] < current[0];
  return candidate[1] < current[1];
}

interface BestPlacement {
  bin: PackedBin;
  node: TreeNode;
  orientation: Orientation;
  fit: [number, number];
}

function findBestPlacement(
  bins: PackedBin[],
  piece: NormalizedPiece,
  allowRotation: boolean,
): BestPlacement | null {
  let best: BestPlacement | null = null;
  for (const bin of bins) {
    for (const node of bin.freeNodes) {
      for (const orientation of orientationsFor(piece, allowRotation)) {
        if (!fits(node, orientation.width, orientation.height)) continue;
        const fit = shortSideFit(node, orientation.width, orientation.height);
        if (
          !best ||
          isBetterFit(fit, best.fit) ||
          (fit[0] === best.fit[0] &&
            fit[1] === best.fit[1] &&
            orientation.rotation === 0 &&
            best.orientation.rotation === 90)
        ) {
          best = { bin, node, orientation, fit };
        }
      }
    }
  }
  return best;
}

function sourcePool(
  normalized: { sheets: NormalizedSource[]; remnants: NormalizedSource[] },
  strategy: "sheets" | "remnants" | "mixed",
): NormalizedSource[] {
  if (strategy === "sheets") return normalized.sheets;
  if (strategy === "remnants") return normalized.remnants;
  return [...normalized.remnants, ...normalized.sheets];
}

function sourceFits(
  source: NormalizedSource,
  piece: NormalizedPiece,
  allowRotation: boolean,
): boolean {
  for (const orientation of orientationsFor(piece, allowRotation)) {
    if (orientation.width <= source.usable_width_mm && orientation.height <= source.usable_height_mm) {
      return true;
    }
  }
  return false;
}

function openBin(source: NormalizedSource): PackedBin {
  instanceCounter += 1;
  const root = makeFreeNode(
    source.margin_mm,
    source.margin_mm,
    source.usable_width_mm,
    source.usable_height_mm,
  );
  const bin: PackedBin = {
    instance_id: `${source.source.source_id}#${instanceCounter}`,
    source,
    root,
    freeNodes: [root],
    placements: [],
    used_area_mm2: 0,
    cost_cents: source.cost_cents,
  };
  return bin;
}

function openBestSource(
  pool: NormalizedSource[],
  piece: NormalizedPiece,
  allowRotation: boolean,
  openedCounts: Map<string, number>,
): NormalizedSource | null {
  let best: NormalizedSource | null = null;
  for (const source of pool) {
    const opened = openedCounts.get(source.source.source_id) ?? 0;
    if (opened >= source.quantity) continue;
    if (!sourceFits(source, piece, allowRotation)) continue;
    if (
      !best ||
      source.area_mm2 < best.area_mm2 ||
      (source.area_mm2 === best.area_mm2 && source.cost_cents < best.cost_cents)
    ) {
      best = source;
    }
  }
  return best;
}

function recordPlacement(bin: PackedBin, piece: NormalizedPiece, node: TreeNode): void {
  const leaf = findPieceLeaf(node, piece.piece_id);
  if (!leaf) return;
  const placement: Placement = {
    piece_id: piece.piece_id,
    order_id: piece.order_id,
    source_id: bin.instance_id,
    x_mm: leaf.piece_x,
    y_mm: leaf.piece_y,
    width_mm: leaf.piece_width,
    height_mm: leaf.piece_height,
    rotation_deg: leaf.rotation_deg,
  };
  bin.placements.push(placement);
  bin.used_area_mm2 += leaf.piece_width * leaf.piece_height;
}

function findPieceLeaf(node: TreeNode, pieceId: string): TreeNode | null {
  if (node.kind === "piece" && node.piece_id === pieceId) return node;
  for (const child of node.children) {
    const found = findPieceLeaf(child, pieceId);
    if (found) return found;
  }
  return null;
}

export function packPieces(
  pieces: NormalizedPiece[],
  normalized: { sheets: NormalizedSource[]; remnants: NormalizedSource[] },
  options: PackOptions,
): PackOutcome {
  resetNodeCounter();
  const pool = sourcePool(normalized, options.strategy);
  const openedCounts = new Map<string, number>();
  const bins: PackedBin[] = [];
  const unplaced: NormalizedPiece[] = [];
  const ordered = [...pieces].sort(options.pieceOrder);

  for (const piece of ordered) {
    const best = findBestPlacement(bins, piece, options.allowRotation);
    if (best) {
      const replaced = best.node;
      const gap = Math.max(best.bin.source.kerf_mm, best.bin.source.separation_mm);
      const newNode = splitNodeForPiece(replaced, piece, best.orientation, gap);
      const index = best.bin.freeNodes.indexOf(replaced);
      if (index >= 0) best.bin.freeNodes.splice(index, 1);
      replaceNode(best.bin.root, replaced, newNode);
      best.bin.freeNodes.push(...collectFree(newNode));
      recordPlacement(best.bin, piece, newNode);
      continue;
    }

    const maxSources = options.maxSources ?? Number.MAX_SAFE_INTEGER;
    if (bins.length >= maxSources) {
      unplaced.push(piece);
      continue;
    }

    const source = openBestSource(pool, piece, options.allowRotation, openedCounts);
    if (!source) {
      unplaced.push(piece);
      continue;
    }

    const bin = openBin(source);
    openedCounts.set(source.source.source_id, (openedCounts.get(source.source.source_id) ?? 0) + 1);
    const orientation = orientationsFor(piece, options.allowRotation).find(
      (o) => o.width <= source.usable_width_mm && o.height <= source.usable_height_mm,
    );
    if (!orientation) {
      unplaced.push(piece);
      continue;
    }
    const gap = Math.max(source.kerf_mm, source.separation_mm);
    const newNode = splitNodeForPiece(bin.root, piece, orientation, gap);
    bin.root = newNode;
    bin.freeNodes = collectFree(newNode);
    recordPlacement(bin, piece, newNode);
    bins.push(bin);
  }

  return { bins, unplaced };
}

function replaceNode(root: TreeNode, target: TreeNode, replacement: TreeNode): boolean {
  if (root === target) {
    return true;
  }
  for (let index = 0; index < root.children.length; index += 1) {
    if (root.children[index] === target) {
      root.children[index] = replacement;
      return true;
    }
    if (replaceNode(root.children[index], target, replacement)) return true;
  }
  return false;
}

function collectFree(node: TreeNode): TreeNode[] {
  const acc: TreeNode[] = [];
  collectFreeNodes(node, acc);
  return acc;
}

export function pieceOrderings(): Record<string, (a: NormalizedPiece, b: NormalizedPiece) => number> {
  return {
    area_desc: (a, b) => b.area_mm2 - a.area_mm2 || b.long_mm - a.long_mm || a.piece_id.localeCompare(b.piece_id),
    long_side_desc: (a, b) => b.long_mm - a.long_mm || b.short_mm - a.short_mm || a.piece_id.localeCompare(b.piece_id),
    difficulty_desc: (a, b) =>
      b.long_mm * b.long_mm + b.area_mm2 - (a.long_mm * a.long_mm + a.area_mm2) ||
      a.piece_id.localeCompare(b.piece_id),
    short_side_desc: (a, b) => b.short_mm - a.short_mm || b.area_mm2 - a.area_mm2 || a.piece_id.localeCompare(b.piece_id),
  };
}
