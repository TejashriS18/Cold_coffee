import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, signJwt, verifyJwt } from "./src/lib/auth.js";
import {
  createOrderInDatabase,
  getOrderById,
  verifyAndUpdatePayment,
  generateOrderNumber,
} from "./src/lib/orders.js";
import { calculateDatabaseOrderPricing } from "./src/lib/server-pricing.js";
import { sanitizeData } from "./src/lib/logger.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:54329/frostbean?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log("=================================================");
console.log("FROST & BEAN: Database & Backend Unit/Integration Tests");
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
  try {
    // 1. Verify Database Models Exist and are Seeded
    console.log("--- Test 1: PostgreSQL Schema & Seed Verification ---");
    const categoryCount = await prisma.category.count();
    assert(categoryCount === 4, `All 4 categories present (found ${categoryCount})`);

    const productCount = await prisma.product.count();
    assert(productCount === 6, `All 6 products present in database (found ${productCount})`);

    const customizationCount = await prisma.customizationOption.count();
    assert(customizationCount >= 10, `Customization options loaded (found ${customizationCount})`);

    const promoCount = await prisma.promotionalOffer.count();
    assert(promoCount >= 5, `Promotional offers loaded (found ${promoCount})`);

    const inventoryCount = await prisma.inventory.count();
    assert(inventoryCount === 6, `Inventory tracking initialized for all products (found ${inventoryCount})`);

    // 2. Authentication & Password Hashing Verification
    console.log("\n--- Test 2: Authentication & Role-Based Authorization ---");
    const testPassword = "SecretPassword123!";
    const hashed = await hashPassword(testPassword);
    assert(hashed !== testPassword, "Password successfully hashed with bcrypt");
    assert(hashed.startsWith("$2"), "Valid bcrypt salt structure verified");

    const validCheck = await verifyPassword(testPassword, hashed);
    assert(validCheck === true, "Valid password passes bcrypt check");

    const invalidCheck = await verifyPassword("WrongPassword", hashed);
    assert(invalidCheck === false, "Incorrect password fails bcrypt check");

    // Token creation and verification
    const token = signJwt({
      userId: "usr-123",
      email: "barista@frostbean.com",
      name: "Barista Alex",
      role: "ADMIN",
    });
    const payload = verifyJwt(token);
    assert(payload?.role === "ADMIN", `JWT token issued and verified with role: ${payload?.role}`);

    // 3. Logger Secret Redaction Verification
    console.log("\n--- Test 3: Secret & PII Redaction in Logging ---");
    const testLogPayload = {
      user: "customer@example.com",
      password: "SuperSecretPassword123!",
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz",
      dbUrl: "postgresql://postgres:mysecretpassword@localhost:54329/frostbean",
      cardNumber: "4111 1111 1111 1234",
      amountPaise: 25400,
    };
    const sanitized = sanitizeData(testLogPayload);
    assert(sanitized.password === "[REDACTED]", "Password field redacted");
    assert(sanitized.passwordHash === "[REDACTED]", "PasswordHash field redacted");
    assert(!String(sanitized.dbUrl).includes("mysecretpassword"), "Database URL password masked");
    assert(!String(sanitized.cardNumber).includes("1111 1111"), "Credit card number redacted");
    assert(sanitized.amountPaise === 25400, "Non-sensitive numerical data preserved");

    // 4. Server-Authoritative Price Calculation from Database
    console.log("\n--- Test 4: Server-Authoritative Database Pricing ---");
    const sampleItems = [
      {
        productId: "choco-mocha", // Base ₹149 (14900 paise)
        customization: {
          size: "Large", // +₹30 (3000 paise)
          milk: "Oat Milk", // +₹25 (2500 paise)
          sweetness: "Regular",
          toppings: [],
          customizationPrice: 0,
          unitPrice: 0,
        },
        quantity: 1,
      },
    ];

    const pricing = await calculateDatabaseOrderPricing(sampleItems, "CHILL20");
    // Unit price = 149 + 30 + 25 = 204 rupees (20400 paise)
    // Discount 20% = 4080 paise
    // Net = 20400 - 4080 = 16320 paise
    // Delivery fee = 4000 paise (< 30000 threshold)
    // GST 5% on 16320 = 816 paise
    // Total = 16320 + 4000 + 816 = 21136 paise
    assert(pricing.subtotalPaise === 20400, `Subtotal authoritatively calculated: ${pricing.subtotalPaise} paise`);
    assert(pricing.discountPaise === 4080, `CHILL20 promo applied discount: ${pricing.discountPaise} paise`);
    assert(pricing.deliveryFeePaise === 4000, `Standard delivery fee applied: ${pricing.deliveryFeePaise} paise`);
    assert(pricing.totalPaise === 21136, `Authoritative total calculated: ₹${(pricing.totalPaise / 100).toFixed(2)}`);

    // 5. Database Transaction: Atomic Order Creation & Inventory Decrement
    console.log("\n--- Test 5: Atomic Order Creation & Inventory Transaction ---");
    const initialInv = await prisma.inventory.findUnique({ where: { productId: "classic-chill" } });
    const initialStock = initialInv.stockCount;

    const orderRes = await createOrderInDatabase({
      customer: {
        name: "Dev Verification Customer",
        mobile: "9876543210",
        address: "Flat 101, Test Lane, Indiranagar, Bengaluru 560038",
      },
      items: [
        {
          productId: "classic-chill",
          customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] },
          quantity: 2,
        },
      ],
      paymentMethod: "online",
      idempotencyKey: "test-idempotency-key-001",
    });

    assert(orderRes.order.orderId.startsWith("FB-"), `Order created with ID: ${orderRes.order.orderId}`);
    assert(orderRes.isDuplicate === false, "First submission acknowledged as new order");

    // Check inventory decrement
    const afterInv = await prisma.inventory.findUnique({ where: { productId: "classic-chill" } });
    assert(
      afterInv.stockCount === initialStock - 2,
      `Inventory atomically decremented by 2 units (${initialStock} -> ${afterInv.stockCount})`
    );

    // 6. Idempotency Test: Duplicate Order Submission Prevention
    console.log("\n--- Test 6: Idempotency Protection ---");
    const duplicateRes = await createOrderInDatabase({
      customer: {
        name: "Dev Verification Customer",
        mobile: "9876543210",
        address: "Flat 101, Test Lane, Indiranagar, Bengaluru 560038",
      },
      items: [
        {
          productId: "classic-chill",
          customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] },
          quantity: 2,
        },
      ],
      paymentMethod: "online",
      idempotencyKey: "test-idempotency-key-001",
    });

    assert(duplicateRes.isDuplicate === true, "Duplicate submission flagged as duplicate");
    assert(duplicateRes.order.orderId === orderRes.order.orderId, "Returned same order ID without double charge");

    // Inventory must NOT have been decremented again
    const postDupInv = await prisma.inventory.findUnique({ where: { productId: "classic-chill" } });
    assert(
      postDupInv.stockCount === initialStock - 2,
      "Inventory remained unchanged during duplicate request"
    );

    // 7. Atomic Payment Verification
    console.log("\n--- Test 7: Atomic Payment Verification ---");
    const paymentVerifyRes = await verifyAndUpdatePayment(orderRes.order.orderId, {
      gateway: "mock",
      transactionReference: "pay_test_ref_12345",
      paymentSignature: "valid_mock_signature_hex",
      status: "success",
    });

    assert(paymentVerifyRes.success === true, "Payment verified successfully");
    assert(paymentVerifyRes.order.paymentStatus === "paid", "Order paymentStatus updated to 'paid'");
    assert(paymentVerifyRes.order.orderStatus === "confirmed", "Order lifecycle status transitioned to 'confirmed'");

    // 8. Order Retrieval by ID
    console.log("\n--- Test 8: Order Persistence & Retrieval ---");
    const fetched = await getOrderById(orderRes.order.orderId);
    assert(fetched !== null, "Order retrievable by orderId");
    assert(fetched.customer.name === "Dev Verification Customer", "Customer details preserved");
    assert(fetched.items[0].productName === "Classic Chill", "Order item snapshot preserved");
    assert(fetched.paymentDetails?.transactionId === "pay_test_ref_12345", "Payment reference recorded without card data");

    // 9. Payment Failure & Automatic Stock Restitution
    console.log("\n--- Test 9: Payment Failure & Inventory Restitution ---");
    const failOrderRes = await createOrderInDatabase({
      customer: {
        name: "Failing Order Customer",
        mobile: "9123456789",
        address: "Lane 5, Residency Road, Bengaluru 560025",
      },
      items: [
        {
          productId: "caramel-bliss",
          customization: { size: "Regular", milk: "Regular Milk", sweetness: "Regular", toppings: [] },
          quantity: 3,
        },
      ],
      paymentMethod: "online",
    });

    const invDuringFail = await prisma.inventory.findUnique({ where: { productId: "caramel-bliss" } });

    // Mark as failed
    const failUpdate = await verifyAndUpdatePayment(failOrderRes.order.orderId, {
      gateway: "mock",
      status: "failed",
      failureReason: "Card insufficient funds",
    });

    assert(failUpdate.success === false, "Payment failure recorded");
    assert(failUpdate.order.orderStatus === "payment_failed", "Order status transitioned to 'payment_failed'");

    const invAfterFail = await prisma.inventory.findUnique({ where: { productId: "caramel-bliss" } });
    assert(
      invAfterFail.stockCount === invDuringFail.stockCount + 3,
      `Inventory replenished automatically on payment failure (+3 restored: ${invDuringFail.stockCount} -> ${invAfterFail.stockCount})`
    );

    console.log("\n=================================================");
    console.log(`Database Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runTests();
