// Automated Backend API Test Suite for FROST & BEAN
const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

console.log("=================================================");
console.log("FROST & BEAN: Extended Backend API Test Suite");
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
  // Test 1: Categories Catalog API
  console.log("--- Test 1: Categories Catalog API ---");
  const catRes = await fetch(`${BASE_URL}/api/categories`);
  const catData = await catRes.json();
  assert(catRes.status === 200, "Categories API returns HTTP 200");
  assert(catData.categories?.length >= 4, `At least 4 categories returned (${catData.categories?.length})`);

  // Test 2: Products Catalog API
  console.log("\n--- Test 2: Products Catalog API ---");
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  const prodData = await prodRes.json();
  assert(prodRes.status === 200, "Products API returns HTTP 200");
  assert(prodData.products?.length >= 6, `At least 6 products returned (${prodData.products?.length})`);

  // Test 3: Single Product Details API
  console.log("\n--- Test 3: Product Detail API ---");
  const detailRes = await fetch(`${BASE_URL}/api/products/classic-chill`);
  const detailData = await detailRes.json();
  assert(detailRes.status === 200, "Product detail returns HTTP 200");
  assert(detailData.product?.name === "Classic Chill", "Returns correct product 'Classic Chill'");
  assert(detailData.product?.availableStock > 0, "Includes live inventory stock status");

  // Test 4: Customer Registration & Login Flow
  console.log("\n--- Test 4: Customer Registration & Auth Flow ---");
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sneha Reddy",
      email: uniqueEmail,
      password: "SecurePassword123!",
      mobile: "9876543210",
      address: "Villa 12, Palm Meadows, Whitefield, Bengaluru 560066",
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 200, "Customer registered with HTTP 200");
  assert(regData.customer?.passwordHash === undefined, "Password hash safely excluded from response");
  assert(typeof regData.token === "string", "Valid JWT token issued upon registration");

  // Login with newly created customer
  const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: uniqueEmail,
      password: "SecurePassword123!",
    }),
  });
  const custLoginData = await custLoginRes.json();
  assert(custLoginRes.status === 200, "Customer login successful with HTTP 200");
  assert(custLoginData.customer?.email === uniqueEmail, "Authenticated customer email matches");

  // Customer me endpoint with token
  const custMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${custLoginData.token}` },
  });
  const custMeData = await custMeRes.json();
  assert(custMeRes.status === 200, "Customer profile accessed via Bearer token");
  assert(custMeData.customer?.name === "Sneha Reddy", "Profile name matches");

  // Test 5: Admin Authentication & Profile Flow
  console.log("\n--- Test 5: Admin Authentication Flow ---");
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@frostbean.com",
      password: "Admin@FrostBean2026!",
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200, "Admin login successful with HTTP 200");
  assert(adminLoginData.admin?.role === "SUPER_ADMIN", "Admin has SUPER_ADMIN role");
  assert(typeof adminLoginData.token === "string", "Admin issued JWT token");

  const adminToken = adminLoginData.token;

  // Test 6: Role-Based Authorization Enforcement
  console.log("\n--- Test 6: Role-Based Authorization Security Checks ---");
  // 6A: Unauthenticated access rejected
  const unauthRes = await fetch(`${BASE_URL}/api/admin/orders`);
  assert(unauthRes.status === 401, "Unauthenticated access to admin orders rejected with HTTP 401");

  // 6B: Customer token attempting admin route rejected
  const forbiddenRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${custLoginData.token}` },
  });
  assert(forbiddenRes.status === 403, "Customer token attempting admin access rejected with HTTP 403 Forbidden");

  // 6C: Valid admin token succeeds
  const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminOrdersData = await adminOrdersRes.json();
  assert(adminOrdersRes.status === 200, "Admin orders list retrieved with HTTP 200");
  assert(Array.isArray(adminOrdersData.orders), "Returns array of persistent orders");

  // Test 7: Admin Inventory Management API
  console.log("\n--- Test 7: Admin Inventory Management ---");
  const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const invData = await invRes.json();
  assert(invRes.status === 200, "Inventory report retrieved with HTTP 200");
  assert(invData.inventory?.length >= 6, "Inventory covers all products");

  // Restock test
  const restockRes = await fetch(`${BASE_URL}/api/admin/inventory/classic-chill`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ stockCount: 150 }),
  });
  const restockData = await restockRes.json();
  assert(restockRes.status === 200, "Product stock restocked via PATCH /api/admin/inventory/[productId]");
  assert(restockData.inventory?.stockCount === 150, "Updated stock count verified in response");

  // Test 8: Admin Promotions Management API
  console.log("\n--- Test 8: Admin Promotions Management ---");
  const promoRes = await fetch(`${BASE_URL}/api/admin/promotions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const promoData = await promoRes.json();
  assert(promoRes.status === 200, "Admin promotions list retrieved with HTTP 200");
  assert(promoData.promotions?.length >= 5, "Promotions returned from database");

  console.log("\n=================================================");
  console.log(`Backend API Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
