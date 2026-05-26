import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { simulateGBMStep } from './utils/gbm.js'

const app = new Hono()

// We store the current stock price in the server's memory.
let currentPriceCents = 15000; 

app.get('/', (c) => {
  return c.text('Stock Exchange Engine is running!')
})

// This is our new API endpoint to get a stock price tick
app.get('/api/tick', (c) => {
  // Calculate the new price using our math engine
  const newPriceCents = simulateGBMStep(
    currentPriceCents / 100, 
    0.05,                    
    0.20,                    
    1 / 252                  
  );

  // Update the global price
  currentPriceCents = newPriceCents;

  // Send the result back
  return c.json({
    priceInCents: currentPriceCents,
    formattedPrice: `$${(currentPriceCents / 100).toFixed(2)}`
  });
})

// --- THE MISSING PIECE ---
// This tells Node.js to actually start listening on a port
const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})