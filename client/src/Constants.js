export const SYMBOLS = ["MOCK", "TECH", "SAFE"];

export const SYMBOL_META = {
  MOCK: { label: "Mock Securities",  accent: "#60a5fa", shadow: "rgba(96,165,250,0.3)"  },
  TECH: { label: "Tech Index",       accent: "#a78bfa", shadow: "rgba(167,139,250,0.3)" },
  SAFE: { label: "Safe Haven Bond",  accent: "#34d399", shadow: "rgba(52,211,153,0.3)"  },
};

export function formatPrice(cents) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}