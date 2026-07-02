import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';

const portfolio = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/portfolio
// ─────────────────────────────────────────────────────────────────────────────
portfolio.get('/portfolio', async (c) => {
  const email  = c.req.query('email');
  const symbol = c.req.query('symbol') || 'MOCK';

  if (!email) {
    return c.json({ error: 'Missing required query param: email' }, 400);
  }

  const { data: portfolioRow } = await supabase
    .from('portfolios')
    .select('wallet_balance_cents')
    .eq('user_email', email)
    .single();

  const { data: holding } = await supabase
    .from('holdings')
    .select('quantity')
    .eq('user_email', email)
    .eq('stock_symbol', symbol)
    .maybeSingle();

  return c.json({
    wallet_balance_cents: portfolioRow?.wallet_balance_cents ?? 0,
    quantity:             holding?.quantity                  ?? 0,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trade (Now powered by Database Transactions!)
// ─────────────────────────────────────────────────────────────────────────────
portfolio.post('/trade', async (c) => {
  const body = await c.req.json();
  const { email, symbol, priceInCents, action } = body;

  if (!email || !symbol || !priceInCents || !action) {
    return c.json({ error: 'Missing required fields: email, symbol, priceInCents, action' }, 400);
  }

  // 1. Trigger the bulletproof SQL transaction we just created
  const { data, error } = await supabase.rpc('execute_trade_securely', {
    p_user_email: email,
    p_stock_symbol: symbol,
    p_price_in_cents: priceInCents,
    p_action: action
  });

  if (error) {
    console.error("Database transaction error:", error);
    return c.json({ error: 'Internal server error during trade.' }, 500);
  }

  // 2. If the SQL function rejected the trade (e.g., insufficient funds)
  if (!data.success) {
    return c.json({ error: data.error }, 400);
  }

  // 3. If successful, pass the exact new numbers back to the frontend receipt
  return c.json({ 
    message: 'Trade executed.', 
    newWalletBalanceCents: data.new_wallet_balance, 
    quantity: data.new_quantity 
  });
});

export default portfolio;