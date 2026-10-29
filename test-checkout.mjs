// Automated End-to-End Test Suite for FROST & BEAN Secure Checkout Flow

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

console.log("=================================================");
console.log("FROST & BEAN: Secure Checkout Test Suite");
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
  // Test 1: Validation Rejection for Invalid Form Data
  console.log("--- Test 1: Field Validation & Inline Error Reporting ---");
  const invalidRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "A", // too short (< 2)
        mobile: "12345", // invalid mobile format
        address: "Short", // too short (< 10)
      },
      paymentMethod: "online",
      items: [{ productId: "classic-chill", customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] }, quantity: 1 }],
    }),
  });

  const invalidData = await invalidRes.json();
  assert(invalidRes.status === 400, "Invalid customer details rejected with HTTP 400");
  assert(invalidData.errors?.name !== undefined, "Reports validation error for 'name'");
  assert(invalidData.errors?.mobile !== undefined, "Reports validation error for 'mobile'");
  assert(invalidData.errors?.address !== undefined, "Reports validation error for 'address'");

  // Test 2: Server-Authoritative Price Calculation & Tamper Resistance
  console.log("\n--- Test 2: Price Tampering Defense (Zero Client Trust) ---");
  // Client attempts to claim that 1 Choco Mocha with Large (+₹30) and Oat Milk (+₹25) is ₹1
  const tamperRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Security Auditor",
        mobile: "9876543210",
        address: "Cyber Security Lab, Innovation Tower, Bengaluru 560001",
      },
      paymentMethod: "online",
      items: [
        {
          productId: "choco-mocha", // Base ₹149
          customization: {
            size: "Large", // +₹30
            milk: "Oat Milk", // +₹25
            sweetness: "Regular",
            toppings: [],
            // Client attempts to spoof unitPrice to ₹1
            unitPrice: 1,
            customizationPrice: 0,
          },
          quantity: 1,
        },
      ],
    }),
  });

  const tamperData = await tamperRes.json();
  assert(tamperRes.status === 200, "Tampered request handled securely by recalculation");
  // Real unit price: 149 + 30 + 25 = 204 rupees (20400 paise)
  // Subtotal = 20400 paise (< 30000 free threshold -> delivery fee 4000 paise / ₹40)
  // GST 5% on 20400 = 1020 paise (₹10.20)
  // Expected total: 20400 + 4000 + 1020 = 25420 paise (₹254.20)
  assert(tamperData.totalPaise === 25420, `Server independently calculated ₹254.20 (25420 paise), got ${tamperData.totalPaise}`);

  const orderId = tamperData.orderId;
  assert(/^FB-\d{8}-[A-Z0-9]{4}$/.test(orderId), `Order ID follows FB-YYYYMMDD-XXXX format: ${orderId}`);

  // Test 3: Order Persistence & Retrieval
  console.log("\n--- Test 3: Persistent Storage Verification ---");
  const getOrderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`);
  const getOrderData = await getOrderRes.json();
  assert(getOrderRes.status === 200, "Order retrievable via GET /api/orders/[orderId]");
  assert(getOrderData.order.orderId === orderId, "Retrieved order matches requested orderId");
  assert(getOrderData.order.orderStatus === "created", "Initial orderStatus is 'created'");
  assert(getOrderData.order.paymentStatus === "pending", "Initial paymentStatus is 'pending'");
  assert(getOrderData.order.items[0].productName === "Choco Mocha", "Stored item snapshot preserves product name");
  assert(getOrderData.order.items[0].customization.size === "Large", "Stored item snapshot preserves cup size");
  assert(getOrderData.order.items[0].customization.milk === "Oat Milk", "Stored item snapshot preserves milk choice");

  // Test 4: Cryptographic Payment Signature Verification & Forgery Rejection
  console.log("\n--- Test 4: Cryptographic Signature Verification ---");
  // 4A: Attempt verification with a fraudulent signature
  const fakeVerifyRes = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      paymentId: "pay_fake_hacker_1234",
      signature: "deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd",
      status: "success",
    }),
  });
  const fakeVerifyData = await fakeVerifyRes.json();
  assert(fakeVerifyRes.status === 400, "Forged payment signature rejected with HTTP 400");
  assert(fakeVerifyData.success === false, "Payment verification safely refused");

  // 4B: Generate authentic mock signature via mock gateway
  const mockProcessRes = await fetch(`${BASE_URL}/api/checkout/mock-gateway/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, action: "success" }),
  });
  const mockProcessData = await mockProcessRes.json();
  assert(mockProcessData.success === true, "Mock gateway issued genuine signed transaction token");

  // 4C: Verify with genuine signature
  const genuineVerifyRes = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      paymentId: mockProcessData.paymentId,
      signature: mockProcessData.signature,
      status: "success",
    }),
  });
  const genuineVerifyData = await genuineVerifyRes.json();
  assert(genuineVerifyRes.status === 200, "Genuine payment signature verified with HTTP 200");
  assert(genuineVerifyData.success === true, "Order successfully confirmed as paid");

  // Re-fetch order from persistence to confirm status
  const verifiedOrderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`);
  const verifiedOrderData = await verifiedOrderRes.json();
  assert(verifiedOrderData.order.paymentStatus === "paid", "Persistent paymentStatus updated to 'paid'");
  assert(verifiedOrderData.order.orderStatus === "confirmed", "Persistent orderStatus updated to 'confirmed'");

  // Test 5: Idempotency Protection
  console.log("\n--- Test 5: Idempotency & Duplicate Request Protection ---");
  const repeatVerifyRes = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      paymentId: mockProcessData.paymentId,
      signature: mockProcessData.signature,
      status: "success",
    }),
  });
  assert(repeatVerifyRes.status === 200, "Duplicate payment verification call handled idempotently");

  // Test 6: Failed Payment Flow & Safe Retry
  console.log("\n--- Test 6: Payment Failure Simulation & Retry ---");
  const failOrderRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Rohan Varma",
        mobile: "9123456789",
        address: "Flat 402, Highrise Apartments, Indiranagar, Bengaluru 560038",
      },
      paymentMethod: "online",
      items: [{ productId: "caramel-bliss", customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] }, quantity: 1 }],
    }),
  });
  const failOrderData = await failOrderRes.json();
  const failOrderId = failOrderData.orderId;

  // Simulate bank decline
  const markFailRes = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: failOrderId,
      status: "failed",
      failureReason: "Card declined by issuing bank (Mock Failure)",
    }),
  });
  const markFailData = await markFailRes.json();
  assert(markFailData.success === false, "Failure report recorded");
  assert(markFailData.canRetry === true, "Order explicitly remains retryable");

  const failedOrderCheck = await (await fetch(`${BASE_URL}/api/orders/${failOrderId}`)).json();
  assert(failedOrderCheck.order.orderStatus === "payment_failed", "Order status recorded as 'payment_failed'");

  // Now perform successful retry on that same order
  const retryMock = await (await fetch(`${BASE_URL}/api/checkout/mock-gateway/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: failOrderId, action: "success" }),
  })).json();

  const retryVerify = await (await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: failOrderId,
      paymentId: retryMock.paymentId,
      signature: retryMock.signature,
      status: "success",
    }),
  })).json();

  assert(retryVerify.success === true, "Payment retry successfully revived and paid order");

  // Test 7: Cash on Delivery (COD) Flow
  console.log("\n--- Test 7: Cash on Delivery (COD) Flow ---");
  const codRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Pooja Hegde",
        mobile: "9845012345",
        address: "B-204, Green Glen Layout, Bellandur, Bengaluru 560103",
        instructions: "Please ring the bell twice and leave package at door.",
      },
      paymentMethod: "cod",
      items: [{ productId: "vanilla-dream", customization: { size: "Regular", milk: "Regular Milk", sweetness: "Less", toppings: [] }, quantity: 1 }],
    }),
  });
  const codData = await codRes.json();
  assert(codRes.status === 200, "COD order accepted with HTTP 200");
  assert(codData.orderStatus === "confirmed", "COD order immediately marked as confirmed");
  assert(codData.paymentMethod === "cod", "Payment method is COD");

  const codCheck = await (await fetch(`${BASE_URL}/api/orders/${codData.orderId}`)).json();
  assert(codCheck.order.paymentStatus === "cod_pending", "COD paymentStatus is 'cod_pending'");
  assert(codCheck.order.customer.instructions.includes("ring the bell"), "Delivery instructions saved");

  // Test 8: COD Threshold Enforcement
  console.log("\n--- Test 8: COD Maximum Order Threshold Enforcement ---");
  // Attempt large COD order (> ₹1000)
  const largeCodRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Corporate Office",
        mobile: "9880011223",
        address: "7th Floor, Tech Park, Outer Ring Road, Bengaluru 560103",
      },
      paymentMethod: "cod",
      items: [{ productId: "oreo-cold-coffee", customization: { size: "Large", milk: "Almond Milk", sweetness: "Regular", toppings: ["Extra Coffee Shot"] }, quantity: 15 }], // ~₹3000
    }),
  });
  const largeCodData = await largeCodRes.json();
  assert(largeCodRes.status === 400, "Excessive COD order rejected with HTTP 400");
  assert(largeCodData.message.includes("Cash on delivery is only available"), "Returns descriptive COD limit message");

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
