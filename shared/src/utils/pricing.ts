export const ETH_PER_YD = 1n / 4000n; // conceptual reference only

export function formatToken(amount: bigint, decimals = 18) {
  const s = amount.toString().padStart(decimals + 1, "0");
  const i = s.length - decimals;
  const whole = s.slice(0, i);
  const frac = s.slice(i).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export function parseUnits(value: string, decimals = 18): bigint {
  const [whole, frac = ""] = value.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole + padded);
}

