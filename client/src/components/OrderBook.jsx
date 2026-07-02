import React, { useState, useEffect, useCallback } from 'react';

// Accept the real logged-in user as a prop
export default function OrderBook({ user }) {
  const [ordersHistory, setOrdersHistory] = useState([]); // Renamed state to reflect full history
  const [holdings, setHoldings] = useState([]); // Track user's owned stocks
  const [stockSymbol, setStockSymbol] = useState('MOCK');
  const [orderType, setOrderType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(100);
  const [statusMessage, setStatusMessage] = useState("");

  // 1. Fetch all orders (Pending, Filled, Cancelled)
  const fetchOrders = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/pending?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrdersHistory(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, [user?.email]);

  // 2. Fetch user's current holdings to validate short selling
  const fetchHoldings = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolioSummary?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data && data.holdings) {
        setHoldings(data.holdings);
      }
    } catch (err) {
      console.error("Error fetching holdings for validation:", err);
    }
  }, [user?.email]);

  // Sync data every 3 seconds
  useEffect(() => {
    fetchOrders();
    fetchHoldings();
    const interval = setInterval(() => {
      fetchOrders();
      fetchHoldings();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchHoldings]);

  async function placeOrder(e) {
    e.preventDefault();
    const targetQuantity = parseInt(quantity);

    // 3. Validation Guard: Check if user owns enough shares to SELL
    if (orderType === 'SELL') {
      const existingHolding = holdings.find(h => h.stock_symbol === stockSymbol);
      const sharesOwned = existingHolding ? existingHolding.quantity : 0;

      if (sharesOwned < targetQuantity) {
        setStatusMessage(`❌ Insufficient shares. You only own ${sharesOwned} shares of ${stockSymbol}.`);
        setTimeout(() => setStatusMessage(""), 4000);
        return; 
      }
    }

    const newOrder = {
      user_email: user.email,
      stock_symbol: stockSymbol,
      orderType: orderType,
      quantity: targetQuantity,
      price_cents: Math.round(parseFloat(price) * 100) 
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (res.ok) {
        setStatusMessage("✅ Order placed successfully!");
        fetchOrders(); 
        fetchHoldings(); 
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatusMessage(`❌ ${errorData.error || "Failed to place order."}`);
      }

      setTimeout(() => setStatusMessage(""), 3000);

    } catch (err) {
      console.error("Error placing order", err);
      setStatusMessage("❌ Network error.");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  }

  // Quick helper to show user how many shares they own right in the form
  const currentStockHolding = holdings.find(h => h.stock_symbol === stockSymbol);
  const sharesAvailable = currentStockHolding ? currentStockHolding.quantity : 0;

  // Helper function to render nice colorful badges for the status
  const getStatusBadge = (status) => {
    if (status === 'FILLED') {
      return <span style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>✅ FILLED</span>;
    }
    if (status === 'CANCELLED') {
      return <span style={{ background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>❌ CANCELLED</span>;
    }
    return <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>⏳ PENDING</span>;
  };

  return (
    <div style={{ padding: '24px', color: '#f1f5f9', fontFamily: '"Sora", sans-serif' }}>
      <h2 style={{ marginBottom: '24px' }}>📉 My Order Book</h2>

      <form onSubmit={placeOrder} style={{ marginBottom: '40px', background: '#0a1120', padding: '24px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Place a New Limit Order</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
          Currently owning: <strong style={{ color: '#3b82f6' }}>{sharesAvailable}</strong> shares of {stockSymbol}
        </p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Stock:</label>
            <select value={stockSymbol} onChange={(e) => setStockSymbol(e.target.value)} style={{ padding: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px' }}>
              <option value="MOCK">MOCK</option>
              <option value="TECH">TECH</option>
              <option value="SAFE">SAFE</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Action:</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={{ padding: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px' }}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Quantity:</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ padding: '8px', width: '80px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Price per share ($):</label>
            <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: '8px', width: '100px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px' }} />
          </div>
        </div>

        <button type="submit" style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Submit Order
        </button>
        
        {statusMessage && (
          <div style={{ marginTop: '16px', color: statusMessage.includes('✅') ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
            {statusMessage}
          </div>
        )}
      </form>

      <h3 style={{ marginBottom: '16px' }}>My Order History</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', background: '#0a1120', borderRadius: '12px', overflow: 'hidden' }}>
        <thead style={{ background: 'rgba(148, 163, 184, 0.05)' }}>
          <tr>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Type</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Stock</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Quantity</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Limit Price</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {ordersHistory.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
              <td style={{ padding: '16px', fontWeight: 'bold', color: order.order_type === 'BUY' ? '#34d399' : '#f87171' }}>{order.order_type}</td>
              <td style={{ padding: '16px' }}>{order.stock_symbol}</td>
              <td style={{ padding: '16px' }}>{order.quantity} shares</td>
              <td style={{ padding: '16px', fontFamily: '"IBM Plex Mono", monospace' }}>${(order.price_cents / 100).toFixed(2)}</td>
              <td style={{ padding: '16px' }}>{getStatusBadge(order.status)}</td>
            </tr>
          ))}
          {ordersHistory.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No order history yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}