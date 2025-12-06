/**
 * NFT Rarity Calculation System
 *
 * Computes rarity tiers based on pixel usage and color diversity.
 * Higher quality artwork (more pixels + more colors) has better odds
 * of rolling rarer tiers.
 */

export type RarityTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export type RarityTable = Record<RarityTier, number>;

/**
 * Base probabilities for each rarity tier (when quality score = 0)
 */
const BASE_PROBS: RarityTable = {
  Common: 0.6,
  Uncommon: 0.25,
  Rare: 0.1,
  Epic: 0.04,
  Legendary: 0.01,
};

/**
 * Boost weights determine how much each tier's probability changes
 * as the quality score increases from 0 to 1.
 *
 * Negative values penalize the tier at high scores.
 * Positive values boost the tier at high scores.
 */
const BOOST_WEIGHTS: Record<RarityTier, number> = {
  Common: -0.4, // penalized as score increases
  Uncommon: 0.2,
  Rare: 0.6,
  Epic: 1.0,
  Legendary: 1.5,
};

/**
 * Computes a continuous quality score (0..1) based on pixel and color usage.
 *
 * @param pixelsUsed - Number of pixels filled (0 to canvasSize²)
 * @param colorsUsed - Number of unique colors used (0 to 16)
 * @param canvasSize - Canvas dimension (e.g., 32 for 32x32)
 * @returns Quality score from 0 to 1
 */
export function computeQualityScore(
  pixelsUsed: number,
  colorsUsed: number,
  canvasSize: number = 32
): number {
  const maxPixels = canvasSize * canvasSize;
  const maxColors = 16;

  const pixelFactor = Math.min(pixelsUsed / maxPixels, 1); // 0..1
  const colorFactor = Math.min(colorsUsed / maxColors, 1); // 0..1

  // Weight pixels more than colors (70/30 split)
  const score = 0.7 * pixelFactor + 0.3 * colorFactor;

  return score;
}

/**
 * Computes adjusted probabilities for each rarity tier based on quality score.
 *
 * @param pixelsUsed - Number of pixels filled
 * @param colorsUsed - Number of unique colors used
 * @param canvasSize - Canvas dimension
 * @returns Normalized probability distribution across all tiers
 */
export function computeProbabilities(
  pixelsUsed: number,
  colorsUsed: number,
  canvasSize: number = 32
): RarityTable {
  const score = computeQualityScore(pixelsUsed, colorsUsed, canvasSize);

  // Apply boost weights to base probabilities
  // Formula: base_prob * (1 + score * weight)
  const raw: Record<RarityTier, number> = {
    Common: BASE_PROBS.Common * (1 + score * BOOST_WEIGHTS.Common),
    Uncommon: BASE_PROBS.Uncommon * (1 + score * BOOST_WEIGHTS.Uncommon),
    Rare: BASE_PROBS.Rare * (1 + score * BOOST_WEIGHTS.Rare),
    Epic: BASE_PROBS.Epic * (1 + score * BOOST_WEIGHTS.Epic),
    Legendary: BASE_PROBS.Legendary * (1 + score * BOOST_WEIGHTS.Legendary),
  };

  // Guard against negative probabilities
  const tiers = Object.keys(raw) as RarityTier[];
  for (const tier of tiers) {
    if (raw[tier] < 0) raw[tier] = 0;
  }

  // Normalize probabilities to sum to 1
  const sum = Object.values(raw).reduce((a, b) => a + b, 0) || 1;

  const normalized: RarityTable = {
    Common: raw.Common / sum,
    Uncommon: raw.Uncommon / sum,
    Rare: raw.Rare / sum,
    Epic: raw.Epic / sum,
    Legendary: raw.Legendary / sum,
  };

  return normalized;
}

/**
 * Rolls for a rarity tier based on pixel/color usage.
 *
 * Uses weighted random selection where higher quality artwork
 * has better odds of rolling rarer tiers.
 *
 * @param pixelsUsed - Number of pixels filled
 * @param colorsUsed - Number of unique colors used
 * @param canvasSize - Canvas dimension
 * @returns The rolled rarity tier
 */
export function rollRarity(
  pixelsUsed: number,
  colorsUsed: number,
  canvasSize: number = 32
): RarityTier {
  const probs = computeProbabilities(pixelsUsed, colorsUsed, canvasSize);
  const r = Math.random();

  let cumulative = 0;
  const tierOrder: RarityTier[] = [
    "Common",
    "Uncommon",
    "Rare",
    "Epic",
    "Legendary",
  ];

  for (const tier of tierOrder) {
    cumulative += probs[tier];
    if (r < cumulative) return tier;
  }

  // Fallback (should never reach here due to normalization)
  return "Common";
}

/**
 * Calculates the number of unique colors in pixel data.
 *
 * @param pixelData - Record mapping coordinates to color hex codes
 * @returns Number of unique colors used
 */
export function countUniqueColors(
  pixelData: Record<string, string>
): number {
  const uniqueColors = new Set(Object.values(pixelData));
  return uniqueColors.size;
}

/**
 * Computes comprehensive rarity statistics for an NFT.
 *
 * @param pixelData - Record mapping coordinates to color hex codes
 * @param canvasSize - Canvas dimension
 * @returns Object containing rarity tier, stats, probabilities, and quality score
 */
export function computeRarityStats(
  pixelData: Record<string, string>,
  canvasSize: number = 32
) {
  const pixelsUsed = Object.keys(pixelData).length;
  const colorsUsed = countUniqueColors(pixelData);
  const qualityScore = computeQualityScore(pixelsUsed, colorsUsed, canvasSize);
  const probabilities = computeProbabilities(pixelsUsed, colorsUsed, canvasSize);
  const rarityTier = rollRarity(pixelsUsed, colorsUsed, canvasSize);

  return {
    rarity: rarityTier,
    stats: {
      pixelsUsed,
      colorsUsed,
      qualityScore: Math.round(qualityScore * 100) / 100, // Round to 2 decimals
    },
    probabilities,
  };
}
