/**
 * Simulates a single stock price step using Geometric Brownian Motion (GBM).
 */
export function simulateGBMStep(
  currentPrice: number,
  drift: number,
  volatility: number,
  dt: number
): number {
  const Z = gaussianRandom();

  const exponent =
    (drift - 0.5 * volatility ** 2) * dt +
    volatility * Math.sqrt(dt) * Z;

  const newPrice = currentPrice * Math.exp(exponent);

  // Store as integer cents to avoid floating-point drift
  return Math.round(newPrice * 100); 
}

/**
 * Box–Muller transform: converts two uniform [0,1) samples
 * into one standard-normal Z ~ N(0,1) variate.
 */
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // exclude exact 0
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
