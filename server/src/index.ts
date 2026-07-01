// ─── index.ts ─────────────────────────────────────────────────────────────────
// Entry point — wires routes and starts the tick engine + HTTP server.

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import orders from './routes/orders.js';
import portfolioSummary from './routes/portfolioSummary.js';

import leaderboard from './routes/leaderboard.js';
import { startTickEngine } from './lib/stockEngine.js';
import market    from './routes/market.js';
import portfolio from './routes/portfolio.js';

const app = new Hono();

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.text('Stock Exchange Engine is running!'));

app.route('/api', market);
app.route('/api', portfolio);
app.route('/api', leaderboard); // <-- ADD THIS LINE
// ─── Mount route modules ──────────────────────────────────────────────────────
app.route('/api', market);    // GET  /api/tick
app.route('/api', portfolio);
app.route('/api/orders', orders);
app.route('/api/portfolioSummary', portfolioSummary); // GET  /api/portfolio  |  POST /api/trade

// ─── Start price-tick engine ──────────────────────────────────────────────────
startTickEngine(2000);

// ─── Start HTTP server ────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });