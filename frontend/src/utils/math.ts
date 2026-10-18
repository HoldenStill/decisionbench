export function calculateShannonEntropy(probabilities: number[]): {
  entropy: number;
  normalizedEntropy: number;
  certainty: number;
} {
  const validProbs = probabilities.filter((p) => p > 0);
  const k = probabilities.length;
  if (k <= 1 || validProbs.length === 0) {
    return { entropy: 0, normalizedEntropy: 0, certainty: 1 };
  }

  const entropy = -validProbs.reduce((sum, p) => sum + p * Math.log2(p), 0);
  const maxEntropy = Math.log2(k);
  const normalizedEntropy = maxEntropy > 0 ? Math.min(1, Math.max(0, entropy / maxEntropy)) : 0;
  const certainty = 1 - normalizedEntropy;

  return {
    entropy: Number(entropy.toFixed(4)),
    normalizedEntropy: Number(normalizedEntropy.toFixed(4)),
    certainty: Number(certainty.toFixed(4)),
  };
}

export function calculateTop2Margin(probabilities: number[]): number | null {
  if (probabilities.length < 2) return null;
  const sorted = [...probabilities].sort((a, b) => b - a);
  return Number((sorted[0] - sorted[1]).toFixed(4));
}
