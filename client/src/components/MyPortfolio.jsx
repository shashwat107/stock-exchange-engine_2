import React, { useState, useEffect } from 'react';

export default function MyPortfolio({ user }) {
  const [portfolioData, setPortfolioData] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch the user's holdings and cash
  useEffect(() => {
    if (!user?.email) return;

    async function fetchPortfolio() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolioSummary?email=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        setPortfolioData(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch portfolio:", error);
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, [user]);

  // 2. Fetch live stock prices every 2 seconds
  useEffect(() => {
    let interval;
    async function fetchLivePrices() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tick`);
        const data = await res.json();
        setLivePrices(data);
      } catch (err) {
        console.error("Failed to fetch live prices", err);
      }
    }

    fetchLivePrices(); 
    interval = setInterval(fetchLivePrices, 2000); 

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '24px', color: 'white' }}>Loading portfolio...</div>;

  // 3. Calculate Total Equity
  const availableCash = portfolioData?.wallet_balance_cents ? portfolioData.wallet_balance_cents / 100 : 0;
  
  let totalStockValue = 0;
  if (portfolioData?.holdings) {
    portfolioData.holdings.forEach(holding => {
      const livePriceCents = livePrices[holding.stock_symbol]?.priceInCents || 0;
      totalStockValue += (holding.quantity * livePriceCents) / 100;
    });
  }
  
  const totalEquity = availableCash + totalStockValue;

  return (
    <div style={{ padding: '24px', color: '#f1f5f9', fontFamily: '"Sora", sans-serif' }}>
      <h2 style={{ marginBottom: '24px' }}>💼 My Portfolio</h2>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#0a1120', padding: '24px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)', flex: 1 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>Available Cash</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#34d399' }}>
            ${availableCash.toFixed(2)}
          </p>
        </div>
        <div style={{ background: '#0a1120', padding: '24px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)', flex: 1 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>Total Equity</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#3b82f6' }}>
            ${totalEquity.toFixed(2)}
          </p>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>My Holdings & Performance</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', background: '#0a1120', borderRadius: '12px', overflow: 'hidden' }}>
        <thead style={{ background: 'rgba(148, 163, 184, 0.05)' }}>
          <tr>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Stock</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Quantity</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Invested</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Live Price</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Total Value</th>
            <th style={{ padding: '16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>All-Time P&L</th>
          </tr>
        </thead>
        <tbody>
          {portfolioData?.holdings && portfolioData.holdings.length > 0 ? (
            portfolioData.holdings.map((holding, index) => {
              const invested = holding.total_invested_cents ? holding.total_invested_cents / 100 : 0;
              const livePrice = livePrices[holding.stock_symbol]?.priceInCents ? livePrices[holding.stock_symbol].priceInCents / 100 : 0;
              const currentValue = holding.quantity * livePrice;
              const pnl = currentValue - invested;
              
              // Only show P&L if they actually have a recorded investment amount
              const showPnl = holding.total_invested_cents !== undefined && invested > 0;

              return (
                <tr key={index} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{holding.stock_symbol}</td>
                  <td style={{ padding: '16px' }}>{holding.quantity}</td>
                  <td style={{ padding: '16px' }}>${invested.toFixed(2)}</td>
                  <td style={{ padding: '16px' }}>${livePrice.toFixed(2)}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>${currentValue.toFixed(2)}</td>
                  <td style={{ 
                    padding: '16px', 
                    fontWeight: 'bold',
                    color: pnl >= 0 ? '#34d399' : '#f87171' 
                  }}>
                    {showPnl ? (pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`) : "N/A"}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>You don't own any stocks yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}