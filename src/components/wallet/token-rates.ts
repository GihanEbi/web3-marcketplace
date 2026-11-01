/**
 * Fixed, clearly fake exchange rates used to show USD-equivalent values in the demo.
 * Nothing here is market data and nothing is fetched.
 */
export const MOCK_USD_RATES: Record<string, number> = {
  USD: 1,
  USDC: 1,
  DAI: 1,
  ETH: 3200,
  MATIC: 0.62,
  SOL: 155,
};

export const TOKEN_NAMES: Record<string, string> = {
  ETH: "Ether",
  USDC: "USD Coin",
  DAI: "Dai Stablecoin",
  MATIC: "Polygon",
  SOL: "Solana",
  USD: "US Dollar",
};

export function toUsd(amount: number, token: string): number {
  return amount * (MOCK_USD_RATES[token] ?? 0);
}
