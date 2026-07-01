import React from 'react';
import './Symboltabs.css';

// ... paste Symboltabs component code here ...
import { SYMBOLS, SYMBOL_META, hexToRgb } from "../Constants";
import "./SymbolTabs.css";

export default function SymbolTabs({ activeSymbol, onSelect }) {
  return (
    <div className="tab-row">
      {SYMBOLS.map((sym) => {
        const isActive = sym === activeSymbol;
        const { accent, shadow } = SYMBOL_META[sym];
        return (
          <button
            key={sym}
            onClick={() => onSelect(sym)}
            className={`tab ${isActive ? "tab--active" : ""}`}
            style={
              isActive
                ? {
                    color: accent,
                    borderColor: accent,
                    background: `rgba(${hexToRgb(accent)},0.08)`,
                    boxShadow: `0 0 12px ${shadow}`,
                  }
                : {}
            }
          >
            {sym}
          </button>
        );
      })}
    </div>
  );
}