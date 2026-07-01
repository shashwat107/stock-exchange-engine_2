import React from 'react';
import './Header.css';

// ... paste Header component code here ...
import { SYMBOL_META } from "../constants";
import { formatPrice } from "../constants";
import SymbolTabs from "./SymbolTabs";
import "./Header.css";

export default function Header({ activeSymbol, currentPrice, priceChange, onSelectSymbol }) {
  const { accent, label: symbolLabel } = SYMBOL_META[activeSymbol];

  return (
    <header className="header">
      <div className="header__identity">
        <div className="header__symbol" style={{ color: accent }}>
          {activeSymbol}
        </div>
        <div className="header__subtitle">{symbolLabel}</div>
      </div>

      <SymbolTabs activeSymbol={activeSymbol} onSelect={onSelectSymbol} />

      <div className="header__price-wrap">
        <div
          className="header__live-price"
          style={{ color: priceChange >= 0 ? "#4ade80" : "#f87171" }}
        >
          {currentPrice ? formatPrice(currentPrice.priceInCents) : "—"}
        </div>
        <div
          className="header__price-change"
          style={{ color: priceChange >= 0 ? "#4ade80" : "#f87171" }}
        >
          {priceChange !== 0
            ? `${priceChange >= 0 ? "▲" : "▼"} $${Math.abs(priceChange).toFixed(2)}`
            : ""}
        </div>
      </div>
    </header>
  );
}