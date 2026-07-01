import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';

const portfolioSummary = new Hono();

portfolioSummary.get('/', async (c) => {
  const email = c.req.query('email');

  if (!email) {
    return c.json({ error: 'Email is required as a query parameter' }, 400);
  }

  try {
    // Step 1: get the wallet balance
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('wallet_balance_cents')
      .eq('user_email', email)
      .single();

    if (portfolioError) {
      console.log('Error fetching portfolio:', portfolioError);
      return c.json({ error: 'Could not find portfolio for this user' }, 404);
    }

    // Step 2: get all the stocks/holdings
    const { data: holdingsData, error: holdingsError } = await supabase
      .from('holdings')
      .select('stock_symbol, quantity')
      .eq('user_email', email);

    if (holdingsError) {
      console.log('Error fetching holdings:', holdingsError);
      return c.json({ error: 'Could not fetch holdings for this user' }, 500);
    }

    // Step 3: put it all together
    const summary = {
      email: email,
      wallet_balance_cents: portfolioData.wallet_balance_cents,
      holdings: holdingsData,
    };

    return c.json(summary);

  } catch (err) {
    console.log('Something went wrong in portfolioSummary route:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default portfolioSummary;