import React, { useState, useEffect, useCallback } from 'react';

// 1. Accept the real logged-in user as a prop
export default function OrderBook({ user }) {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [stockSymbol, setStockSymbol] = useState('MOCK');
  const [orderType, setOrderType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(100);
  const [statusMessage, setStatusMessage] = useState("");

  // 2. Pass the real user's email to the backend to get ONLY their orders
  const fetchOrders = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/orders/pending?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPendingOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function placeOrder(e) {
    e.preventDefault();

    const newOrder = {
      user_email: user.email, // 3. Securely use the authenticated email
      stock_symbol: stockSymbol,
      order_type: orderType,
      quantity: parseInt(quantity),
      price_cents: Math.round(parseFloat(price) * 100) 
    };

    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (res.ok) {
        setStatusMessage("✅ Order placed successfully!");
        fetchOrders(); 
      } else {
        setStatusMessage("❌ Failed to place order.");
      }

      setTimeout(() => setStatusMessage(""), 3000);

    } catch (err) {
      console.error("Error placing order", err);
      setStatusMessage("❌ Network error.");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  }

  return (
    <div style={{ padding: '24px', color: '#f1f5f9', fontFamily: '"Sora", sans-serif' }}>
      <h2 style={{ marginBottom: '24px' }}>📉 My Pending Orders</h2>

      <form onSubmit={placeOrder} style={{ marginBottom: '40px', background: '#0a1120', padding: '24px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Place a New Limit Order</h3>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {/* Notice the manual email input field has been completely deleted! */}
          
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

      <h3 style={{ marginBottom: '16px' }}>My Waiting Orders</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', background: '#0a1120', borderRadius: '12px', overflow: 'hidden' }}>
        <thead style={{ background: 'rgba(148, 163, 184, 0.05)' }}>
          <tr>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Type</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Stock</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Quantity</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Limit Price</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
              <td style={{ padding: '16px', fontWeight: 'bold', color: order.order_type === 'BUY' ? '#34d399' : '#f87171' }}>{order.order_type}</td>
              <td style={{ padding: '16px' }}>{order.stock_symbol}</td>
              <td style={{ padding: '16px' }}>{order.quantity} shares</td>
              <td style={{ padding: '16px', fontFamily: '"IBM Plex Mono", monospace' }}>${(order.price_cents / 100).toFixed(2)}</td>
            </tr>
          ))}
          {pendingOrders.length === 0 && (
            <tr>
              <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No pending orders right now.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}