export interface PricingInput {
  areaMm2: number;
  pieces: number;
  cuts: number;
  pricePerM2Cents: number;
  pricePerPieceCents: number;
  pricePerCutCents: number;
}

export interface PricingBreakdown {
  material_cents: number;
  cutting_cents: number;
  total_cents: number;
}

export function computeCost(input: PricingInput): PricingBreakdown {
  const squareMeters = input.areaMm2 / 1_000_000;
  const material = Math.round(squareMeters * input.pricePerM2Cents);
  const cutting =
    input.pieces * input.pricePerPieceCents + input.cuts * input.pricePerCutCents;
  return {
    material_cents: material,
    cutting_cents: cutting,
    total_cents: material + cutting,
  };
}

export interface OrderTotals {
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
}

export function computeOrderTotals(subtotalCents: number, discountCents: number): OrderTotals {
  const safeDiscount = Math.max(0, Math.min(discountCents, subtotalCents));
  return {
    subtotal_cents: subtotalCents,
    discount_cents: safeDiscount,
    total_cents: subtotalCents - safeDiscount,
  };
}
