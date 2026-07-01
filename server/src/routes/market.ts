// ─── routes/market.ts ────────────────────────────────────────────────────────
// Market data routes — read-only, no auth required.
//
//   GET /api/tick   → returns current price snapshot for all stocks

import { Hono } from 'hono';
import { stocks } from '../lib/stockEngine.js';

const market = new Hono();

/**
 * GET /api/tick
 * Returns a live price snapshot for every stock in the engine.
 *
 * Response shape:
 * {
 *   MOCK: { priceInCents: number, formattedPrice: string },
 *   TECH: { ... },
 *   SAFE: { ... },
 * }
 */
market.get('/tick', (c) => {
  const payload: Record<string, { priceInCents: number; formattedPrice: string }> = {};

  for (const symbol in stocks) {
    const { priceInCents } = stocks[symbol];
    payload[symbol] = {
      priceInCents,
      formattedPrice: (priceInCents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
    };
  }

  return c.json(payload);
});

export default market;