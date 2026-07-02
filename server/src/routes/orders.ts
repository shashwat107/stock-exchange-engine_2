import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import { processOrderBook } from '../lib/matchingEngine.js'; // 1. IMPORT THE ENGINE

const orders = new Hono();

// Route 1: Get the order history for the logged-in user
orders.get('/pending', async (c) => {
  try {
    const email = c.req.query('email');
    
    if (!email) {
      return c.json({ error: "User email is required" }, 400);
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      // 🔥 THE FIX: Fetch all order statuses so they don't disappear!
      .in('status', ['PENDING', 'FILLED', 'CANCELLED'])
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Route 2: Place a new order
orders.post('/place', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.user_email || !body.stock_symbol || !body.order_type || !body.quantity || !body.price_cents) {
       return c.json({ error: "Missing required fields" }, 400);
    }

    const { error } = await supabase
      .from('orders')
      .insert([{
          user_email: body.user_email,
          stock_symbol: body.stock_symbol,
          order_type: body.order_type,
          quantity: body.quantity,
          price_cents: body.price_cents,
          status: 'PENDING'
      }]);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 🔥 2. THE MAGIC HAPPENS HERE: Wake up the engine to check for matches!
    await processOrderBook(body.stock_symbol);

    return c.json({ message: "Order placed successfully!" }, 201);

  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default orders;