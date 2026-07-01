import React from 'react';
import './Sidebar.css';

export default function Sidebar({ currentView, setCurrentView, isOpen, setIsOpen }) {
  return (
    <div className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--closed"}`}>
      
      {/* Top section with Hamburger + Brand */}
      <div className="sidebar__header">
        <button 
          className="hamburger-btn" 
          onClick={() => setIsOpen(!isOpen)}
          title="Toggle Sidebar"
        >
          ☰
        </button>
        
        {isOpen && (
          <div className="sidebar__brand">
            <div className="brand-dot"></div>
            <span>TRADE ENGINE</span>
          </div>
        )}
      </div>
      
      {/* Navigation Buttons */}
      <nav className="sidebar__nav">
        <button 
          className={`nav-btn ${currentView === "dashboard" ? "nav-btn--active" : ""}`}
          onClick={() => setCurrentView("dashboard")}
          title="Dashboard"
        >
          <span className="nav-icon">📊</span>
          {isOpen && <span className="nav-label">Dashboard</span>}
        </button>
        
        <button 
          className={`nav-btn ${currentView === "leaderboard" ? "nav-btn--active" : ""}`}
          onClick={() => setCurrentView("leaderboard")}
          title="Leaderboard"
        >
          <span className="nav-icon">🏆</span>
          {isOpen && <span className="nav-label">Leaderboard</span>}
        </button>

        <button
          className={`nav-btn ${currentView === "orderbook" ? "nav-btn--active" : ""}`}
          onClick={() => setCurrentView("orderbook")}
          title="Live Order Book"
        >
          <span className="nav-icon">📉</span>
          {isOpen && <span className="nav-label">Live Order Book</span>}
        </button>

        <button
          className={`nav-btn ${currentView === "portfolio" ? "nav-btn--active" : ""}`}
          onClick={() => setCurrentView("portfolio")}
          title="My Portfolio"
        >
          <span className="nav-icon">💼</span>
          {isOpen && <span className="nav-label">My Portfolio</span>}
        </button>
      </nav>
      
    </div>
  );
}