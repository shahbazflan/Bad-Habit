export interface PricingLineInput {
  productId: string;
  price: number;
  quantity: number;
}

export interface PairPricingBreakdown {
  pairCount: number;
  rawSubtotal: number;
  pairDiscount: number;
  discountedSubtotal: number;
  formattedRawSubtotal: string;
  formattedPairDiscount: string;
  formattedDiscountedSubtotal: string;
}

export const PAIR_DISCOUNT_RATE = 0.15;

export function parseNumericPrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
}

export function isShirtProductId(productId: string): boolean {
  return productId.startsWith('BH-S');
}

export function isTopProductId(productId: string): boolean {
  return productId.startsWith('BH-S') || productId.startsWith('BH-H');
}

export function isTrouserProductId(productId: string): boolean {
  return productId.startsWith('BH-T') || productId.startsWith('BH-0');
}

/**
 * Matches Top (Shirt or Hoodie/Sweatshirt) + Trouser pairs in the bag
 * (highest-value eligible items paired first) and computes a flat 15% discount on each pair.
 */
export function calculateBagTotals(items: PricingLineInput[]): PairPricingBreakdown {
  const topUnitPrices: number[] = [];
  const trouserUnitPrices: number[] = [];
  let rawSubtotal = 0;

  for (const item of items) {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.price) || 0);
    rawSubtotal += unitPrice * qty;

    if (isTopProductId(item.productId)) {
      for (let i = 0; i < qty; i++) topUnitPrices.push(unitPrice);
    } else if (isTrouserProductId(item.productId)) {
      for (let i = 0; i < qty; i++) trouserUnitPrices.push(unitPrice);
    }
  }

  topUnitPrices.sort((a, b) => b - a);
  trouserUnitPrices.sort((a, b) => b - a);

  const pairCount = Math.min(topUnitPrices.length, trouserUnitPrices.length);
  let pairDiscount = 0;

  for (let i = 0; i < pairCount; i++) {
    const pairSum = topUnitPrices[i] + trouserUnitPrices[i];
    pairDiscount += Math.round(pairSum * PAIR_DISCOUNT_RATE);
  }

  const discountedSubtotal = Math.max(0, rawSubtotal - pairDiscount);

  return {
    pairCount,
    rawSubtotal,
    pairDiscount,
    discountedSubtotal,
    formattedRawSubtotal: `PKR ${rawSubtotal.toLocaleString()}`,
    formattedPairDiscount: `PKR ${pairDiscount.toLocaleString()}`,
    formattedDiscountedSubtotal: `PKR ${discountedSubtotal.toLocaleString()}`,
  };
}
