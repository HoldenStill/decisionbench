export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatMicroCost(usd: number): string {
  if (usd === 0) return 'FREE';
  if (usd < 0.0001) {
    return `$${usd.toFixed(6)}`;
  }
  return `$${usd.toFixed(4)}`;
}

export function formatScaleCost(perRunUsd: number): { per1k: string; per1m: string } {
  const per1k = perRunUsd * 1000;
  const per1m = perRunUsd * 1000000;
  return {
    per1k: per1k === 0 ? '$0.00' : `$${per1k.toFixed(3)}`,
    per1m: per1m === 0 ? '$0.00' : `$${per1m.toFixed(2)}`,
  };
}

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${(delta * 100).toFixed(1)}%`;
}
