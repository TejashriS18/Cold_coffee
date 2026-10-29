/**
 * FROST & BEAN Special Offers Configuration
 * Allows the business to configure promotions, active date windows, terms, and eligibility rules.
 */

export interface SpecialOffer {
  id: string;
  title: string;
  badge: string;
  category: "combo" | "bundle" | "seasonal";
  description: string;
  promoCode: string;
  discountSummary: string;
  discountType: "fixed" | "percentage" | "free_shipping";
  discountValuePaise?: number; // For fixed discount in paise
  discountPercent?: number; // For percentage discount
  minItems?: number;
  minOrderPaise?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  formattedEndDate: string;
  terms: string[];
  image: string;
  highlightColor?: string;
}

export const DEFAULT_OFFER_EVALUATION_DATE = "2026-10-18T12:00:00Z";

export const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: "offer-brownie-combo",
    title: "Cold Coffee & Warm Fudge Brownie Combo",
    badge: "Bestseller Pairing",
    category: "combo",
    description:
      "Indulge in any handcrafted 16 oz cold brew paired with our warm Belgian dark chocolate fudge brownie. Save flat ₹50 on this pairing.",
    promoCode: "BROWNIE50",
    discountSummary: "Save Flat ₹50",
    discountType: "fixed",
    discountValuePaise: 5000,
    minOrderPaise: 20000, // ₹200 min
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    formattedEndDate: "Dec 31, 2026",
    terms: [
      "Valid on orders containing any coffee drink and min. subtotal of ₹200",
      "One redemption per order",
      "Applicable across all store locations & delivery",
      "Valid until Dec 31, 2026",
    ],
    image: "/images/coffee-brownie-combo.jpg",
    highlightColor: "#C58A4A",
  },
  {
    id: "offer-b2g1-free",
    title: "Buy 2 Get 1 Chill Free",
    badge: "Community Special",
    category: "bundle",
    description:
      "Order any two premium cold coffees and get a 3rd Classic Chill (₹99 value) completely complimentary on us. Perfect for sharing with friends.",
    promoCode: "B2G1FREE",
    discountSummary: "Free ₹99 Drink",
    discountType: "fixed",
    discountValuePaise: 9900,
    minItems: 3,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    formattedEndDate: "Dec 31, 2026",
    terms: [
      "Requires a minimum of 3 drinks in your cart",
      "Discounts ₹99 equivalent to a complimentary Classic Chill",
      "Cannot be combined with other promotional codes",
      "Valid until Dec 31, 2026",
    ],
    image: "/images/creamy-milk-cold-coffee.jpg",
    highlightColor: "#3B241A",
  },
  {
    id: "offer-seasonal-nitro",
    title: "Seasonal Harvest: Spiced Cinnamon Cold Brew",
    badge: "Limited Release",
    category: "seasonal",
    description:
      "Small-batch single-origin Arabica steeped with Ceylon cinnamon quills and Madagascar vanilla, crowned with cold foam. 20% off all seasonal brews.",
    promoCode: "SEASONAL20",
    discountSummary: "20% Off Brews",
    discountType: "percentage",
    discountPercent: 20,
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    formattedEndDate: "Nov 30, 2026",
    terms: [
      "Valid on all Seasonal and Special category items",
      "No minimum purchase required",
      "Available while seasonal coffee bean harvest lasts",
      "Valid until Nov 30, 2026",
    ],
    image: "/images/hazelnut-heaven.jpg",
    highlightColor: "#6F4935",
  },
];

export interface OfferEligibilityResult {
  isEligible: boolean;
  isDateActive: boolean;
  statusMessage: string;
  daysRemaining?: number;
}

/**
 * Validates offer dates and cart criteria to confirm customer eligibility.
 * Accepts an optional reference date to ensure deterministic prerendering.
 */
export function checkOfferEligibility(
  offer: SpecialOffer,
  cartTotalCount: number,
  subtotalPaise: number,
  currentDate?: Date
): OfferEligibilityResult {
  const now = currentDate || new Date(DEFAULT_OFFER_EVALUATION_DATE);
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);

  // 1. Validate date window
  if (now < start) {
    return {
      isEligible: false,
      isDateActive: false,
      statusMessage: `Offer begins on ${offer.startDate}.`,
    };
  }

  if (now > end) {
    return {
      isEligible: false,
      isDateActive: false,
      statusMessage: "Offer has ended.",
    };
  }

  // Calculate days remaining
  const msInDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / msInDay));

  // 2. Validate cart item requirement
  if (offer.minItems && cartTotalCount < offer.minItems) {
    const missing = offer.minItems - cartTotalCount;
    return {
      isEligible: false,
      isDateActive: true,
      daysRemaining,
      statusMessage: `Add ${missing} more ${missing === 1 ? "drink" : "drinks"} to your cart to claim.`,
    };
  }

  // 3. Validate minimum subtotal
  if (offer.minOrderPaise && subtotalPaise < offer.minOrderPaise) {
    const missingRupees = ((offer.minOrderPaise - subtotalPaise) / 100).toFixed(0);
    return {
      isEligible: false,
      isDateActive: true,
      daysRemaining,
      statusMessage: `Add ₹${missingRupees} more to reach minimum order of ₹${(offer.minOrderPaise / 100).toFixed(0)}.`,
    };
  }

  return {
    isEligible: true,
    isDateActive: true,
    daysRemaining,
    statusMessage: "Eligible! Ready to apply to your cart.",
  };
}
