import React, { useState, useEffect } from 'react';
import './Tradingpanel.css';
import { SYMBOL_META, formatPrice, hexToRgb } from "../constants";

// ─── TradeStatusBanner ───────────────────────────────────────────────────────
function TradeStatusBanner({ status }) {
  if (!status) return null;
  const isSuccess = status.type === "success";
  return (
    <div className={`trade-banner ${isSuccess ? "trade-banner--success" : "trade-banner--error"}`}>
      <span className="trade-banner__icon">{isSuccess ? "✓" : "✗"}</span>
      {status.message}
    </div>
  );
}

// ─── BalancesSection ─────────────────────────────────────────────────────────
function BalancesSection({ portfolio, activeSymbol }) {
  const isLoading = portfolio === null;
  return (
    <div className="balances-grid">
      <div className="balance-cell">
        <div className="price-label">CASH BALANCE</div>
        {isLoading ? (
          <div className="skeleton-line" />
        ) : (
          <div className="balance-value">
            {formatPrice(portfolio.wallet_balance_cents)}
          </div>
        )}
      </div>
      <div className="balance-divider" />
      <div className="balance-cell balance-cell--right">
        <div className="price-label">{activeSymbol} SHARES</div>
        {isLoading ? (
          <div className="skeleton-line skeleton-line--right" />
        ) : (
          <div className="balance-value">
            {/* FIXED: Looking for real quantity instead of mock_quantity */}
            {portfolio.quantity ?? 0}
            <span className="balance-unit">
              {(portfolio.quantity ?? 0) === 1 ? "share" : "shares"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TradeButton ─────────────────────────────────────────────────────────────
function TradeButton({
  label,
  arrow,
  colorActive,
  colorHover,
  shadowColor,
  isLoading,
  isDisabled,
  onClick,
}) {
  const [hovered, setHovered] = useState(false);
  const bg = isDisabled ? "#1e293b" : hovered ? colorHover : colorActive;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`trade-btn ${isDisabled ? "trade-btn--disabled" : ""}`}
      style={{
        background: bg,
        color: isDisabled ? "#475569" : "#fff",
        cursor: isDisabled ? "not-allowed" : "pointer",
        boxShadow: isDisabled ? "none" : `0 4px 24px ${shadowColor}`,
      }}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isLoading ? (
        <span className="spinner-wrap">
          <span className="spinner" />
          Placing…
        </span>
      ) : (
        <>
          <span className="trade-btn__arrow">{arrow}</span>
          {label}
        </>
      )}
    </button>
  );
}

// ─── TradingPanel ─────────────────────────────────────────────────────────────
export default function TradingPanel({
  user,
  currentPrice,
  portfolio,
  activeSymbol,
  onFetchPortfolio,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [tradeStatus, setTradeStatus] = useState(null);

  useEffect(() => {
    setTradeStatus(null);
  }, [activeSymbol]);

  // FIXED: Looking for real quantity instead of mock_quantity
  const canSell = portfolio !== null && (portfolio.quantity ?? 0) >= 1;
  const noPrice = !currentPrice;
  const anyLoading = loadingAction !== null;
  const { accent } = SYMBOL_META[activeSymbol];

  const handleTrade = async (actionType) => {
    if (anyLoading || noPrice) return;
    setLoadingAction(actionType);
    setTradeStatus(null);

    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          symbol: activeSymbol,
          priceInCents: currentPrice.priceInCents,
          action: actionType,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || data.message || `Server error: ${response.status}`);

      const verb = actionType === "BUY" ? "Bought" : "Sold";
      setTradeStatus({
        type: "success",
        message: `${verb} 1 share of ${activeSymbol} at ${formatPrice(currentPrice.priceInCents)}`,
      });
      if (onFetchPortfolio) await onFetchPortfolio();
    } catch (err) {
      setTradeStatus({
        type: "error",
        message: err.message || "Trade failed. Please try again.",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="panel">
      {/* Panel Header */}
      <div className="panel__header">
        <div className="panel__title">
          <span
            className="panel__dot"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
          />
          Trading Panel
        </div>
        <div
          className="symbol-badge"
          style={{
            color: accent,
            background: `rgba(${hexToRgb(accent)},0.1)`,
            borderColor: `rgba(${hexToRgb(accent)},0.3)`,
          }}
        >
          {activeSymbol}
        </div>
      </div>

      {/* Balances */}
      <BalancesSection portfolio={portfolio} activeSymbol={activeSymbol} />

      {/* Price Row */}
      <div className="price-row">
        <div>
          <div className="price-label">LAST PRICE</div>
          <div className="price-value">
            {noPrice ? "—" : formatPrice(currentPrice.priceInCents)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="price-label">ORDER TYPE</div>
          <div className="order-type">Market</div>
        </div>
      </div>

      {/* Trade Buttons */}
      <div className="trade-btn-row">
        <TradeButton
          label="Buy 1 Share"
          arrow="↑"
          colorActive="#15803d"
          colorHover="#16a34a"
          shadowColor="rgba(21,128,61,0.3)"
          isLoading={loadingAction === "BUY"}
          isDisabled={
            anyLoading ||
            noPrice ||
            (portfolio?.wallet_balance_cents < currentPrice?.priceInCents)
          }
          onClick={() => handleTrade("BUY")}
        />
        <TradeButton
          label="Sell 1 Share"
          arrow="↓"
          colorActive="#b91c1c"
          colorHover="#dc2626"
          shadowColor="rgba(185,28,28,0.3)"
          isLoading={loadingAction === "SELL"}
          isDisabled={anyLoading || noPrice || !canSell}
          onClick={() => handleTrade("SELL")}
        />
      </div>

      {/* Status Banner */}
      <TradeStatusBanner status={tradeStatus} />

      {/* Account Row */}
      <div className="account-row">
        <span className="account-label">Account</span>
        <span className="account-value">{user?.email ?? "—"}</span>
      </div>
    </div>
  );
}