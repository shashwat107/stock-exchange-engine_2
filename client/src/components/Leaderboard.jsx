import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRankings() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`);
        const data = await res.json();
        
        if (cancelled) return;
        
        // ARMOR: Only set rankings if the backend actually sent an array!
        if (Array.isArray(data)) {
          setRankings(data);
        } else {
          console.error("Backend error:", data);
          setRankings([]); // Fallback to an empty list instead of crashing
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        if (!cancelled) {
          setRankings([]);
          setIsLoading(false);
        }
      }
    }

    // Fetch immediately, then poll every 2 seconds to match the market tick
    fetchRankings();
    const id = setInterval(fetchRankings, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isLoading) {
    return <div className="leaderboard-loading">Calculating live rankings...</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">🏆 Global Leaderboard</h2>
        <p className="leaderboard-subtitle">Live Net Worth (Cash + Active Shares)</p>
      </div>

      <div className="table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Trader</th>
              <th className="text-right">Uninvested Cash</th>
              <th className="text-right">Total Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((user, index) => {
              // Assign styling for 1st, 2nd, and 3rd place
              let rankClass = "rank-standard";
              if (index === 0) rankClass = "rank-gold";
              if (index === 1) rankClass = "rank-silver";
              if (index === 2) rankClass = "rank-bronze";

              return (
                <tr key={user.username} className="leaderboard-row">
                  <td className={`rank-cell ${rankClass}`}>
                    {index === 0 && "🥇 "}
                    {index === 1 && "🥈 "}
                    {index === 2 && "🥉 "}
                    #{index + 1}
                  </td>
                  <td className="username-cell">{user.username}</td>
                  <td className="text-right cash-cell">{formatMoney(user.cash)}</td>
                  <td className="text-right networth-cell">{formatMoney(user.totalNetWorth)}</td>
                </tr>
              );
            })}
            
            {rankings.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-state">No active traders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}