// Automated Test Suite for FROST & BEAN Homepage Sections & Offers Engine

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

console.log("=================================================");
console.log("FROST & BEAN: Homepage Sections & Offers Test Suite");
console.log(`Target: ${BASE_URL}`);
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = "") {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

async function runTests() {
  // Test 1: Homepage HTTP 200 & Content Inspection
  console.log("--- Test 1: Homepage Rendering & Section Integrity ---");
  const res = await fetch(`${BASE_URL}/`);
  assert(res.status === 200, "Homepage returns HTTP 200 OK");
  const html = await res.text();

  // About Us assertions
  assert(html.includes("Made with Passion. Served with Chill."), "About Us heading 'Made with Passion. Served with Chill.' present");
  assert(html.includes("Western Ghats"), "Mentions single-origin Western Ghats Arabica beans");
  assert(html.includes("24-Hour Sub-Zero Cold Extraction"), "Highlights 24-hour sub-zero cold extraction approach");
  assert(html.includes("cafe-roastery-lab.jpg"), "Embeds authentic café and roastery lab photography");

  // Special Offers assertions
  assert(html.includes("Cold Coffee &amp; Warm Fudge Brownie Combo") || html.includes("Cold Coffee & Warm Fudge Brownie Combo"), "Special Offers includes Coffee & Brownie Combo");
  assert(html.includes("Buy 2 Get 1 Chill Free"), "Special Offers includes Buy 2 Get 1 Free (B2G1)");
  assert(html.includes("Seasonal Harvest: Spiced Cinnamon Cold Brew"), "Special Offers includes Seasonal Coffee Special");
  assert(html.includes("coffee-brownie-combo.jpg"), "Embeds coffee and brownie combo imagery");
  assert(html.includes("BROWNIE50"), "Configured promo code BROWNIE50 present in markup");
  assert(html.includes("B2G1FREE"), "Configured promo code B2G1FREE present in markup");
  assert(html.includes("SEASONAL20"), "Configured promo code SEASONAL20 present in markup");

  // Customer Reviews assertions
  assert(html.includes("Tasting Notes from Coffee Lovers"), "Customer Reviews section heading present");
  assert(html.includes("Transparency Notice") || html.includes("Demonstration Data"), "Prominent consumer transparency disclaimer present");
  assert(html.includes("Sample Data"), "Reviews clearly labeled with 'Sample Data' badge");
  assert(html.includes("Leave Honest Feedback"), "Interactive feedback submission action present");

  // Navigation anchors assertions
  assert(html.includes('id="about"'), "Anchor #about present for About Us");
  assert(html.includes('id="offers"'), "Anchor #offers present for Special Offers");
  assert(html.includes('id="reviews"'), "Anchor #reviews present for Customer Reviews");
  assert(html.includes('id="contact"'), "Anchor #contact present for Contact & Tasting Room");

  // Test 2: Special Offers Eligibility Validation
  console.log("\n--- Test 2: Offer Eligibility & Business Rules Validation ---");
  // Test B2G1: Ineligible with 2 items, eligible with 3 items
  const b2g1Offer = {
    id: "offer-b2g1-free",
    title: "Buy 2 Get 1 Free",
    promoCode: "B2G1FREE",
    minItems: 3,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  // Mock checking logic mirroring checkOfferEligibility
  function checkEligibility(offer, itemsCount, subtotalPaise, testDate) {
    const now = testDate ? new Date(testDate) : new Date("2026-10-18T12:00:00Z");
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (now < start || now > end) return { eligible: false, reason: "date_inactive" };
    if (offer.minItems && itemsCount < offer.minItems) return { eligible: false, reason: "items_short", missing: offer.minItems - itemsCount };
    if (offer.minOrderPaise && subtotalPaise < offer.minOrderPaise) return { eligible: false, reason: "subtotal_short" };
    return { eligible: true };
  }

  const b2g1Test1 = checkEligibility(b2g1Offer, 2, 25000);
  assert(b2g1Test1.eligible === false && b2g1Test1.missing === 1, "B2G1 correctly identifies that 2 items is 1 item short of eligibility");

  const b2g1Test2 = checkEligibility(b2g1Offer, 3, 35000);
  assert(b2g1Test2.eligible === true, "B2G1 qualifies when 3 or more drinks are in cart");

  // Test Brownie Combo: Ineligible under ₹200, eligible at or above ₹200
  const brownieOffer = {
    id: "offer-brownie-combo",
    title: "Coffee & Brownie Combo",
    promoCode: "BROWNIE50",
    minOrderPaise: 20000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  const brownieTest1 = checkEligibility(brownieOffer, 1, 9900); // ₹99
  assert(brownieTest1.eligible === false, "Brownie combo rejects subtotal under ₹200");

  const brownieTest2 = checkEligibility(brownieOffer, 2, 22800); // ₹228
  assert(brownieTest2.eligible === true, "Brownie combo approves subtotal >= ₹200");

  // Test Date Boundaries
  const expiredOffer = { ...brownieOffer, endDate: "2025-12-31" };
  const expiredTest = checkEligibility(expiredOffer, 2, 25000, "2026-10-18T12:00:00Z");
  assert(expiredTest.eligible === false && expiredTest.reason === "date_inactive", "Expired offer correctly marked inactive");

  // Test 3: End-to-End Server Order Recalculation with New Offer Codes
  console.log("\n--- Test 3: Checkout Server Verification with New Offer Codes ---");
  // Test code BROWNIE50 on an order of ₹228 (2x Vanilla Dream @ ₹114 = ₹228 = 22800 paise)
  // Base Vanilla Dream is ₹119 -> 2x = 23800 paise
  // With BROWNIE50: -₹50 (-5000 paise) -> net taxable 18800 paise
  // Delivery fee: ₹40 (4000 paise) because net < ₹300
  // GST 5%: 5% of 18800 = 940 paise
  // Total = 18800 + 4000 + 940 = 23740 paise (₹237.40)
  const brownieOrderRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Offer Tester",
        mobile: "9876543210",
        address: "Coffee Tasting Lab, Residency Road, Bengaluru 560025",
      },
      paymentMethod: "online",
      promoCode: "BROWNIE50",
      items: [
        {
          productId: "vanilla-dream", // ₹119
          customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] },
          quantity: 2,
        },
      ],
    }),
  });

  const brownieOrderData = await brownieOrderRes.json();
  assert(brownieOrderRes.status === 200, "Server successfully creates order with promo BROWNIE50");
  assert(brownieOrderData.totalPaise === 23740, `Server correctly calculated ₹237.40 (23740 paise) for BROWNIE50, got ${brownieOrderData.totalPaise}`);

  // Test code B2G1FREE on 3 drinks: (3x Classic Chill @ ₹99 = 29700 paise)
  // Discount: ₹99 off (-9900 paise) -> net taxable: 19800 paise
  // Delivery fee: ₹40 (4000 paise)
  // GST 5%: 5% of 19800 = 990 paise
  // Total: 19800 + 4000 + 990 = 24790 paise (₹247.90)
  const b2g1OrderRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "B2G1 Tester",
        mobile: "9988776655",
        address: "Friends Hostel, Church Street, Bengaluru 560001",
      },
      paymentMethod: "online",
      promoCode: "B2G1FREE",
      items: [
        {
          productId: "classic-chill", // ₹99
          customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] },
          quantity: 3,
        },
      ],
    }),
  });

  const b2g1OrderData = await b2g1OrderRes.json();
  assert(b2g1OrderRes.status === 200, "Server successfully creates order with promo B2G1FREE");
  assert(b2g1OrderData.totalPaise === 24790, `Server correctly calculated ₹247.90 (24790 paise) for B2G1FREE, got ${b2g1OrderData.totalPaise}`);

  // Test B2G1 rejection when items < 3
  const b2g1RejectRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Under Minimum Items",
        mobile: "9988776655",
        address: "Church Street, Bengaluru 560001",
      },
      paymentMethod: "online",
      promoCode: "B2G1FREE",
      items: [
        {
          productId: "classic-chill",
          customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] },
          quantity: 2, // only 2 items!
        },
      ],
    }),
  });

  const b2g1RejectData = await b2g1RejectRes.json();
  assert(b2g1RejectRes.status === 400, "Server rejects B2G1FREE when cart has less than 3 drinks");
  assert(b2g1RejectData.message.includes("requires at least 3 drinks"), "Returns clear error explaining 3 drinks requirement");

  console.log("\n=================================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
