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
// POST /api/trade
// ─────────────────────────────────────────────────────────────────────────────
portfolio.post('/trade', async (c) => {
  const body = await c.req.json();
  const { email, symbol, priceInCents, action } = body;

  if (!email || !symbol || !priceInCents || !action) {
    return c.json({ error: 'Missing required fields: email, symbol, priceInCents, action' }, 400);
  }

  const { data: portfolioRow } = await supabase
    .from('portfolios')
    .select('wallet_balance_cents')
    .eq('user_email', email)
    .single();

  if (!portfolioRow) {
    return c.json({ error: 'Portfolio not found for the provided email.' }, 404);
  }

  const { data: holding } = await supabase
    .from('holdings')
    .select('quantity')
    .eq('user_email', email)
    .eq('stock_symbol', symbol)
    .maybeSingle();

  const currentQty    = holding?.quantity ?? 0;
  const currentWallet = portfolioRow.wallet_balance_cents;

  // ── BUY ───────────────────────────────────────────────────────────────────
  if (action === 'BUY') {
    if (currentWallet < priceInCents) {
      return c.json({ error: 'Insufficient funds.' }, 400);
    }

    const newBalance = currentWallet - priceInCents;

    // 1. Take the money
    await supabase.from('portfolios').update({ wallet_balance_cents: newBalance }).eq('user_email', email);

    // 2. Add the stock (Safely, without looking for invested_cents)
    if (holding) {
      await supabase.from('holdings')
        .update({ quantity: currentQty + 1 })
        .eq('user_email', email)
        .eq('stock_symbol', symbol);
    } else {
      await supabase.from('holdings')
        .insert([{ user_email: email, stock_symbol: symbol, quantity: 1 }]);
    }

    return c.json({ message: 'Trade executed.', newWalletBalanceCents: newBalance, quantity: currentQty + 1 });
  }

  // ── SELL ──────────────────────────────────────────────────────────────────
  if (action === 'SELL') {
    if (currentQty < 1) {
      return c.json({ error: 'No shares to sell.' }, 400);
    }

    const newBalance = currentWallet + priceInCents;

    // 1. Give the money
    await supabase.from('portfolios').update({ wallet_balance_cents: newBalance }).eq('user_email', email);

    // 2. Remove the stock
    await supabase.from('holdings')
      .update({ quantity: currentQty - 1 })
      .eq('user_email', email)
      .eq('stock_symbol', symbol);

    return c.json({ message: 'Trade executed.', newWalletBalanceCents: newBalance, quantity: currentQty - 1 });
  }

  return c.json({ error: `Unknown action "${action}". Use BUY or SELL.` }, 400);
});

export default portfolio;