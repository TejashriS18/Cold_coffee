/**
 * FROST & BEAN Shopping Cart & Checkout Configuration
 * All monetary calculations use integer values in paise (1 INR = 100 paise)
 * to avoid floating point precision issues.
 */

export interface PromoCode {
  code: string;
  description: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number; // percentage (e.g. 20 for 20%) or fixed paise (e.g. 5000 for ₹50)
  minOrderPaise?: number; // minimum subtotal in paise required
  minItems?: number; // minimum items required
}

export const CART_CONFIG = {
  // 5% GST on prepared café beverages
  gstRate: 0.05,

  // Standard delivery fee: ₹40 (4000 paise)
  standardDeliveryPaise: 4000,

  // Free delivery threshold: Orders ₹300 and above (30000 paise) get free delivery
  freeDeliveryThresholdPaise: 30000,

  // Supported promotional discount codes
  validPromoCodes: [
    {
      code: "CHILL20",
      description: "20% off on your entire cold order",
      type: "percentage",
      value: 20,
    },
    {
      code: "FROSTDUO",
      description: "Flat ₹50 off on orders above ₹200",
      type: "fixed",
      value: 5000,
      minOrderPaise: 20000,
    },
    {
      code: "BROWNIE50",
      description: "Flat ₹50 off Coffee & Brownie pairing (min order ₹200)",
      type: "fixed",
      value: 5000,
      minOrderPaise: 20000,
    },
    {
      code: "B2G1FREE",
      description: "Buy 2 Get 1 Free (₹99 discount on 3+ drinks)",
      type: "fixed",
      value: 9900,
      minItems: 3,
    },
    {
      code: "SEASONAL20",
      description: "20% off Seasonal Harvest Cold Brews",
      type: "percentage",
      value: 20,
    },
    {
      code: "NITROGLOW",
      description: "15% off artisanal brews",
      type: "percentage",
      value: 15,
    },
    {
      code: "FREESHIP",
      description: "Free express cold delivery on any order",
      type: "free_shipping",
      value: 0,
    },
  ] as PromoCode[],
};
