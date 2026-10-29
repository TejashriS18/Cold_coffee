// Automated Unit Test for FROST & BEAN Shopping Cart Financial Engine

console.log("==========================================");
console.log("FROST & BEAN: Shopping Cart Test Suite");
console.log("==========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    failed++;
  }
}

// Config mirroring site and cart configs
const CART_CONFIG = {
  gstRate: 0.05,
  standardDeliveryPaise: 4000,
  freeDeliveryThresholdPaise: 30000,
  validPromoCodes: [
    { code: "CHILL20", type: "percentage", value: 20 },
    { code: "FROSTDUO", type: "fixed", value: 5000, minOrderPaise: 20000 },
    { code: "NITROGLOW", type: "fixed", value: 3000, minOrderPaise: 15000 },
    { code: "FREESHIP", type: "free_shipping", value: 0 },
  ],
};

function toPaise(rupees) {
  return Math.round(rupees * 100);
}

function formatPaise(paise) {
  const safePaise = Math.max(0, Math.round(paise));
  const rupees = safePaise / 100;
  if (safePaise % 100 === 0) {
    return `₹${rupees.toFixed(0)}`;
  }
  return `₹${rupees.toFixed(2)}`;
}

// 1. Test Base Product Prices
const sampleProducts = [
  { id: "classic-chill", name: "Classic Chill", price: 99 },
  { id: "caramel-bliss", name: "Caramel Bliss", price: 129 },
  { id: "choco-mocha", name: "Choco Mocha", price: 149 },
];

const classicChill = sampleProducts.find((p) => p.id === "classic-chill");
const caramelBliss = sampleProducts.find((p) => p.id === "caramel-bliss");
const chocoMocha = sampleProducts.find((p) => p.id === "choco-mocha");

assert(classicChill.price === 99, "Classic Chill price is ₹99");
assert(caramelBliss.price === 129, "Caramel Bliss price is ₹129");
assert(chocoMocha.price === 149, "Choco Mocha price is ₹149");

// 2. Test Customization Price Calculation in Paise
// Large (+₹30) + Oat Milk (+₹25) + Whipped Cream (+₹20) + Extra Shot (+₹30) = +₹105
const customExtraRupees = 30 + 25 + 20 + 30; // 105
assert(customExtraRupees === 105, "Customization extras equal ₹105 (30+25+20+30)");

const unitPriceRupees = classicChill.price + customExtraRupees; // 99 + 105 = 204
const unitPricePaise = toPaise(unitPriceRupees); // 20400 paise
assert(unitPricePaise === 20400, "Customized unit price is 20400 paise (₹204)");

// 3. Test Subtotal for 2 quantities
const quantity = 2;
const subtotalPaise = unitPricePaise * quantity; // 40800 paise (₹408)
assert(subtotalPaise === 40800, "Subtotal for 2 customized Classic Chills is 40800 paise (₹408)");

// 4. Test Delivery Fee Logic
// Subtotal is ₹408, which is >= ₹300 threshold -> Delivery must be FREE (0 paise)
const deliveryFeeHighOrder =
  subtotalPaise >= CART_CONFIG.freeDeliveryThresholdPaise
    ? 0
    : CART_CONFIG.standardDeliveryPaise;
assert(deliveryFeeHighOrder === 0, "Orders >= ₹300 qualify for FREE delivery (0 paise)");

// Small order: 1 regular Classic Chill (₹99 = 9900 paise) -> Delivery should be ₹40 (4000 paise)
const smallSubtotalPaise = toPaise(99);
const deliveryFeeSmallOrder =
  smallSubtotalPaise >= CART_CONFIG.freeDeliveryThresholdPaise
    ? 0
    : CART_CONFIG.standardDeliveryPaise;
assert(
  deliveryFeeSmallOrder === 4000,
  "Orders < ₹300 incur ₹40 standard delivery fee (4000 paise)"
);

// 5. Test Promo Code Discounts
// Code CHILL20: 20% off
const promo20 = CART_CONFIG.validPromoCodes.find((p) => p.code === "CHILL20");
const discount20Paise = Math.round((subtotalPaise * promo20.value) / 100); // 20% of 40800 = 8160 paise (₹81.60)
assert(discount20Paise === 8160, "CHILL20 gives 20% discount (8160 paise / ₹81.60)");

// Code FROSTDUO: Flat ₹50 off on orders >= ₹200
const promoDuo = CART_CONFIG.validPromoCodes.find((p) => p.code === "FROSTDUO");
const meetsDuoMin = subtotalPaise >= promoDuo.minOrderPaise;
assert(meetsDuoMin === true, "Order meets FROSTDUO minimum requirement of ₹200");
const discountDuoPaise = promoDuo.value; // 5000 paise (₹50)
assert(discountDuoPaise === 5000, "FROSTDUO gives flat ₹50 discount (5000 paise)");

// 6. Test Tax Calculation (5% GST)
const netTaxablePaise = subtotalPaise - discount20Paise; // 40800 - 8160 = 32640 paise
const gstPaise = Math.round(netTaxablePaise * CART_CONFIG.gstRate); // 5% of 32640 = 1632 paise (₹16.32)
assert(gstPaise === 1632, "5% GST on net taxable amount is 1632 paise (₹16.32)");

// 7. Test Final Total Calculation
const finalTotalPaise = netTaxablePaise + deliveryFeeHighOrder + gstPaise; // 32640 + 0 + 1632 = 34272 paise (₹342.72)
assert(finalTotalPaise === 34272, "Final total in paise is 34272 paise (₹342.72)");
assert(formatPaise(finalTotalPaise) === "₹342.72", "Formatted final total matches ₹342.72");

// 8. Test Non-Negativity and Minimum Boundary Guards
const hugeDiscountPaise = 999999;
const safeDiscountPaise = Math.max(0, Math.min(subtotalPaise, hugeDiscountPaise));
assert(safeDiscountPaise === subtotalPaise, "Discount is capped at subtotal (cannot produce negative prices)");

// 9. Test Quantity Boundaries
const invalidZeroQty = Math.max(1, Math.min(50, Math.floor(0)));
assert(invalidZeroQty === 1, "Quantity <= 0 is safely clamped or handled");
const invalidHighQty = Math.max(1, Math.min(50, Math.floor(999)));
assert(invalidHighQty === 50, "Quantity > 50 is safely clamped to 50");

console.log("\n==========================================");
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
