import type { ObjectiveWeights } from "./types";

export interface ScoreInput {
  utilizationPercent: number;
  piecesCount: number;
  operationsCount: number;
  sourcesUsed: number;
  weights: ObjectiveWeights;
  constraintsViolated: boolean;
}

export interface ScoreBreakdown {
  score: number;
  efficiency: number;
  cut_ease: number;
  operation_count: number;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function computeScore(input: ScoreInput): ScoreBreakdown {
  if (input.constraintsViolated) {
    return { score: 0, efficiency: 0, cut_ease: 0, operation_count: 0 };
  }

  const efficiency = clamp(input.utilizationPercent);
  const cutEase = clamp(100 - 4 * Math.max(0, input.sourcesUsed - 1));
  const cutsPerPiece =
    input.piecesCount > 0 ? input.operationsCount / input.piecesCount : input.operationsCount;
  const operationCount = clamp(100 - cutsPerPiece * 25);

  const weights = input.weights;
  const total = weights.efficiency + weights.cut_ease + weights.operation_count;
  if (total <= 0) {
    return { score: efficiency, efficiency, cut_ease: cutEase, operation_count: operationCount };
  }

  const score =
    (weights.efficiency * efficiency +
      weights.cut_ease * cutEase +
      weights.operation_count * operationCount) /
    total;

  return {
    score: Math.round(score * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    cut_ease: Math.round(cutEase * 100) / 100,
    operation_count: Math.round(operationCount * 100) / 100,
  };
}
