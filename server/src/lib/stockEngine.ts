// ─── lib/stockEngine.ts ───────────────────────────────────────────────────────
// Owns all mutable stock state and the price-tick interval.
// Import `stocks` anywhere you need a live price read.

export interface StockState {
  priceInCents: number;
  volatility: number;
}

export const stocks: Record<string, StockState> = {
  MOCK: { priceInCents: 15000, volatility: 40  },
  TECH: { priceInCents: 35000, volatility: 150 },
  SAFE: { priceInCents:  5000, volatility:   8 },
};

/** Starts the background price-tick engine. Call once from index.ts. */
export function startTickEngine(intervalMs = 2000): NodeJS.Timeout {
  return setInterval(() => {
    for (const symbol in stocks) {
      const stock = stocks[symbol];
      const direction = Math.random() < 0.5 ? 1 : -1;
      const swing = Math.floor(Math.random() * stock.volatility);
      stock.priceInCents = Math.max(100, stock.priceInCents + direction * swing);
    }
  }, intervalMs);
}