import { Hono } from 'hono';
import { stocks } from '../lib/stockEngine.js';
import { supabase } from '../lib/supabase.js';

const leaderboard = new Hono();

leaderboard.get('/leaderboard', async (c) => {
  try {
    // 1. Fetch cash balances from the 'portfolios' table
    const { data: portfolios, error: portError } = await supabase
      .from('portfolios')
      .select('user_email, wallet_balance_cents');

    if (portError) throw portError;

    // 2. Fetch stock shares from the 'holdings' table using correct column names
    const { data: holdings, error: holdError } = await supabase
      .from('holdings')
      .select('user_email, stock_symbol, quantity');

    if (holdError) throw holdError;

    // 3. Combine them into a single map based on user_email
    const userMap: Record<string, { email: string; cashCents: number; holdings: Record<string, number> }> = {};

    // Map the cash
    portfolios?.forEach((row) => {
      userMap[row.user_email] = {
        email: row.user_email,
        cashCents: row.wallet_balance_cents || 0,
        holdings: {},
      };
    });

    // Map the shares
    holdings?.forEach((row) => {
      if (userMap[row.user_email]) {
        // Use stock_symbol and quantity to map the user's assets
        userMap[row.user_email].holdings[row.stock_symbol] = row.quantity;
      }
    });

    // 4. Calculate total Net Worth using live prices
    const rankings = Object.values(userMap).map((user) => {
      let totalStockValueCents = 0;

      for (const symbol in user.holdings) {
        const sharesHeld = user.holdings[symbol];
        const currentLivePriceCents = stocks[symbol]?.priceInCents || 0;
        totalStockValueCents += (sharesHeld * currentLivePriceCents);
      }

      const totalNetWorthCents = user.cashCents + totalStockValueCents;
      
      // Extract username from email
      const displayUsername = user.email.split('@')[0];

      return {
        username: displayUsername,
        // Convert everything from cents back to dollars for the frontend
        cash: user.cashCents / 100,
        totalNetWorth: totalNetWorthCents / 100,
      };
    });

    // 5. Sort highest to lowest
    rankings.sort((a, b) => b.totalNetWorth - a.totalNetWorth);

    return c.json(rankings);
  } catch (err: any) {
    console.error("Leaderboard Error:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default leaderboard;