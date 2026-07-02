// ─── index.ts ─────────────────────────────────────────────────────────────────
// Entry point — wires routes and starts the tick engine + HTTP server.

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors'; // <-- NEW: Import CORS

import orders from './routes/orders.js';
import portfolioSummary from './routes/portfolioSummary.js';
import leaderboard from './routes/leaderboard.js';
import { startTickEngine } from './lib/stockEngine.js';
import market    from './routes/market.js';
import portfolio from './routes/portfolio.js';

const app = new Hono();

// ─── CORS Configuration ───────────────────────────────────────────────────────
// This tells the server to accept requests from any frontend domain (like Vercel)
app.use('/*', cors({
  origin: '*', 
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.text('Stock Exchange Engine is running!'));

// ─── Mount route modules ──────────────────────────────────────────────────────
app.route('/api', market);
app.route('/api', portfolio);
app.route('/api', leaderboard); 
app.route('/api/orders', orders);
app.route('/api/portfolioSummary', portfolioSummary); 

// ─── Start price-tick engine ──────────────────────────────────────────────────
startTickEngine(2000);

// ─── Start HTTP server ────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({ fetch: app.fetch, port });