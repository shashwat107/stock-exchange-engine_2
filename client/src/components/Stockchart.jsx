import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SYMBOL_META } from "../Constants";
import "./Stockchart.css";

// We added averageCost as a new prop here
export default function Stockchart({ priceHistory, activeSymbol, averageCost }) {
  const { accent } = SYMBOL_META[activeSymbol];

  return (
    <div className="chart-card">
      <div className="chart-card__label">
        <span className="chart-card__dot" style={{ background: accent }} />
        PRICE CHART — {activeSymbol}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={priceHistory}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
              <stop offset="100%" stopColor={accent} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.08)"
            vertical={false}
          />
          <XAxis dataKey="time" hide />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#475569", fontSize: 11 }}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={52}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "6px",
              color: "#e2e8f0",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "12px",
            }}
            formatter={(v) => [`$${v.toFixed(2)}`, "Price"]}
            labelFormatter={() => ""}
          />
          
          {/* This is the new Break-Even Line. It only draws if averageCost is greater than 0 */}
          {averageCost > 0 && (
            <ReferenceLine 
              y={averageCost} 
              stroke="#94a3b8" 
              strokeDasharray="4 4" 
              label={{ position: 'top', value: 'Avg Cost', fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
            />
          )}

          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#lineGrad)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}