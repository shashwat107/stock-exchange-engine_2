import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import Auth from "./Auth";
import Header from "./components/Header";
import Stockchart from "./components/Stockchart";
import Tradingpanel from "./components/Tradingpanel";
import Sidebar from "./components/Sidebar";
import Leaderboard from "./components/Leaderboard";
import OrderBook from "./components/OrderBook";
import "./index.css";
import "./App.css";
import MyPortfolio from './components/MyPortfolio';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState("MOCK");
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ─── Portfolio fetch (Powered by TanStack Query) ─────────────────────────
 const { data: portfolio = null, refetch: fetchPortfolio } = useQuery({
    queryKey: ['portfolio', user?.email, activeSymbol],
    queryFn: async () => {
      if (!user?.email) return null;
      const res = await fetch(
        `/api/portfolio?email=${encodeURIComponent(user.email)}&symbol=${activeSymbol}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      return data;
    },
    enabled: !!user?.email, // Only fetch if the user is actually logged in
    staleTime: 1000 * 60 * 5, // Cache the data for 5 minutes
  });

  // ─── Price tick polling ────────────────────────────────────────────────────
  const activeSymbolRef = useRef(activeSymbol);
  useEffect(() => {
    activeSymbolRef.current = activeSymbol;
  }, [activeSymbol]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchTick() {
      try {
        const res = await fetch("/api/tick");
        const data = await res.json();
        if (cancelled) return;

        const sym = activeSymbolRef.current;
        const tick = data[sym];
        if (!tick) return;

        setCurrentPrice({ priceInCents: tick.priceInCents });
        setPriceHistory((h) => [
          ...h.slice(-49),
          { time: "now", price: tick.priceInCents / 100 },
        ]);
      } catch (err) {
        console.error("Tick fetch error:", err);
      }
    }

    fetchTick();
    const id = setInterval(fetchTick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);

  // ─── Symbol selection ──────────────────────────────────────────────────────
  const handleSelectSymbol = (sym) => {
    setActiveSymbol(sym);
    setCurrentPrice(null);
    setPriceHistory([]);
    // Removed setPortfolio(null) because TanStack Query handles clearing/caching automatically now!
  };

  // ─── Auth gate ─────────────────────────────────────────────────────────────
  if (!user) {
    return <Auth onLogin={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const priceChange =
    priceHistory.length >= 2
      ? priceHistory[priceHistory.length - 1].price -
        priceHistory[priceHistory.length - 2].price
      : 0;

  // ─── Calculate Average Cost ────────────────────────────────────────────────
  let averageCost = 0;
  if (portfolio && portfolio.quantity > 0 && portfolio.total_invested_cents) {
    averageCost = (portfolio.total_invested_cents / 100) / portfolio.quantity;
  }

  return (
    <div
      className="app-root"
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* ── Left Sidebar ── */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* ── Main Content Area ── */}
      <div
        className="app-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Header - Only render if on the dashboard */}
        {currentView === "dashboard" && (
          <div style={{ padding: "16px 24px" }}>
            <Header
              activeSymbol={activeSymbol}
              currentPrice={currentPrice}
              priceChange={priceChange}
              onSelectSymbol={handleSelectSymbol}
            />
          </div>
        )}

        {/* ── View Router ── */}
        <div style={{ padding: "0 24px 24px 24px", flex: 1 }}>
          {currentView === "dashboard" && (
            <div className="dashboard-body" style={{ height: "100%" }}>
              <div className="dashboard-body__chart">
                <Stockchart
                  priceHistory={priceHistory}
                  activeSymbol={activeSymbol}
                  averageCost={averageCost}
                />
              </div>
              <div className="dashboard-body__panel">
                <Tradingpanel
                  user={user}
                  currentPrice={currentPrice}
                  portfolio={portfolio}
                  activeSymbol={activeSymbol}
                  onFetchPortfolio={fetchPortfolio}
                />
              </div>
            </div>
          )}

          {currentView === "leaderboard" && <Leaderboard />}

          {currentView === "orderbook" && <OrderBook user={user} />}
          {currentView === 'portfolio' && <MyPortfolio user={user} />}
        </div>
      </div>
    </div>
  );
}