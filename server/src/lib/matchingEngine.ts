import { supabase } from './supabase.js';

// 🔥 THE MUTEX LOCK: This is the secret to a real exchange. 
// It remembers which stocks are currently being calculated so they don't duplicate.
const activeProcessing = new Set<string>();

export async function processOrderBook(stockSymbol: string) {
  // 1. CONCURRENCY GUARD: If the engine is already crunching this stock, stop and wait!
  if (activeProcessing.has(stockSymbol)) {
    console.log(`⏳ Engine already processing ${stockSymbol}, skipping concurrent run.`);
    return; 
  }
  
  // Lock the stock!
  activeProcessing.add(stockSymbol); 

  try {
    console.log(`⚙️ [MATCHING ENGINE] Checking board for ${stockSymbol}...`);
    
    // 1. Get highest BUY orders
    const { data: buys } = await supabase
      .from('orders')
      .select('*')
      .eq('stock_symbol', stockSymbol)
      .eq('order_type', 'BUY')
      .eq('status', 'PENDING')
      .order('price_cents', { ascending: false })
      .order('created_at', { ascending: true });

    // 2. Get lowest SELL orders
    const { data: sells } = await supabase
      .from('orders')
      .select('*')
      .eq('stock_symbol', stockSymbol)
      .eq('order_type', 'SELL')
      .eq('status', 'PENDING')
      .order('price_cents', { ascending: true })
      .order('created_at', { ascending: true });

    if (!buys || !sells || buys.length === 0 || sells.length === 0) return;

    // 3. Match them up!
    let buyIdx = 0;
    let sellIdx = 0;

    while (buyIdx < buys.length && sellIdx < sells.length) {
      let currentBuy = buys[buyIdx];
      let currentSell = sells[sellIdx];

      // If the highest buyer isn't willing to pay what the lowest seller wants, stop.
      if (currentBuy.price_cents < currentSell.price_cents) {
        break; 
      }

      // 🔥 2. WASH TRADING GUARD: Prevent users from buying from themselves!
      if (currentBuy.user_email === currentSell.user_email) {
        console.warn(`🚨 Wash trade prevented for ${currentBuy.user_email}. Auto-cancelling duplicate order.`);
        
        // Cancel the newer order so it doesn't freeze the orderbook forever
        await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', currentSell.id);
        sellIdx++;
        continue; // Skip to the next match
      }

      // Calculate the trade
      const tradeQuantity = Math.min(currentBuy.quantity, currentSell.quantity);
      const executionPrice = currentSell.price_cents; 
      const totalCost = tradeQuantity * executionPrice;

      console.log(`🤝 MATCH! ${currentBuy.user_email} buys ${tradeQuantity} ${stockSymbol} from ${currentSell.user_email} at $${executionPrice/100}`);

      // --- 4. EXECUTE THE TRADE IN THE DATABASE ---

      // A. Move the Money
      const { data: bWallet } = await supabase.from('portfolios').select('wallet_balance_cents').eq('user_email', currentBuy.user_email).single();
      const { data: sWallet } = await supabase.from('portfolios').select('wallet_balance_cents').eq('user_email', currentSell.user_email).single();
      
      await supabase.from('portfolios').update({ wallet_balance_cents: (bWallet?.wallet_balance_cents || 0) - totalCost }).eq('user_email', currentBuy.user_email);
      await supabase.from('portfolios').update({ wallet_balance_cents: (sWallet?.wallet_balance_cents || 0) + totalCost }).eq('user_email', currentSell.user_email);

      // B. Move the Shares
      const { data: bHoldings } = await supabase.from('holdings').select('quantity').eq('user_email', currentBuy.user_email).eq('stock_symbol', stockSymbol).single();
      if (bHoldings) {
        await supabase.from('holdings').update({ quantity: bHoldings.quantity + tradeQuantity }).eq('user_email', currentBuy.user_email).eq('stock_symbol', stockSymbol);
      } else {
        await supabase.from('holdings').insert([{ user_email: currentBuy.user_email, stock_symbol: stockSymbol, quantity: tradeQuantity }]);
      }

      const { data: sHoldings } = await supabase.from('holdings').select('quantity').eq('user_email', currentSell.user_email).eq('stock_symbol', stockSymbol).single();
      if (sHoldings) {
        await supabase.from('holdings').update({ quantity: sHoldings.quantity - tradeQuantity }).eq('user_email', currentSell.user_email).eq('stock_symbol', stockSymbol);
      }

      // C. Update the Orders on the board
      currentBuy.quantity -= tradeQuantity;
      currentSell.quantity -= tradeQuantity;

      if (currentBuy.quantity === 0) {
        await supabase.from('orders').update({ quantity: 0, status: 'FILLED' }).eq('id', currentBuy.id);
        buyIdx++;
      } else {
        await supabase.from('orders').update({ quantity: currentBuy.quantity }).eq('id', currentBuy.id);
      }

      if (currentSell.quantity === 0) {
        await supabase.from('orders').update({ quantity: 0, status: 'FILLED' }).eq('id', currentSell.id);
        sellIdx++;
      } else {
        await supabase.from('orders').update({ quantity: currentSell.quantity }).eq('id', currentSell.id);
      }
    }

  } catch (err) {
    console.error("Matching Engine Error:", err);
  } finally {
    // 🔥 ALWAYS UNLOCK THE STOCK WHEN FINISHED OR IF IT CRASHES
    activeProcessing.delete(stockSymbol);
  }
}