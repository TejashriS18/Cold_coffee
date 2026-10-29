export const siteConfig = {
  name: "FROST & BEAN",
  description: "Modern Artisanal Cold Coffee & Nitro Roastery",
  currency: {
    symbol: "₹",
    code: "INR",
  },
};

/**
 * Converts rupees to integer paise (1 INR = 100 paise)
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to rupees
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/**
 * Formats integer paise into a clean currency string with the configured currency symbol.
 * E.g. 9900 paise -> "₹99", 12950 paise -> "₹129.50"
 */
export function formatPaise(paise: number): string {
  const safePaise = Math.max(0, Math.round(paise));
  const rupees = safePaise / 100;
  if (safePaise % 100 === 0) {
    return `${siteConfig.currency.symbol}${rupees.toFixed(0)}`;
  }
  return `${siteConfig.currency.symbol}${rupees.toFixed(2)}`;
}

/**
 * Reusable price formatter using the configurable site currency.
 * Accepts price in rupees and formats using integer paise calculations.
 */
export function formatPrice(priceInRupees: number): string {
  return formatPaise(toPaise(priceInRupees));
}
