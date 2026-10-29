/**
 * FROST & BEAN Checkout & Payment Configuration
 */

export const CHECKOUT_CONFIG = {
  // Cash on Delivery business rules
  isCodEnabled: true,
  maxCodOrderPaise: 100000, // Maximum allowed order value for COD is ₹1,000 (100,000 paise)
  codConvenienceFeePaise: 0, // No extra charge for COD

  // Mock Payment Gateway Configuration
  mockPaymentEnabled: true,
  mockGatewayName: "FROST & BEAN Secure Gateway (Test Environment)",

  // Estimated preparation & delivery time in minutes
  estimatedDeliveryMinutesMin: 25,
  estimatedDeliveryMinutesMax: 35,

  // Server-only payment signature secret (never exposed to client bundle)
  // In production this is loaded from environment variables
  paymentGatewaySecret:
    process.env.PAYMENT_GATEWAY_SECRET || "frost_bean_secure_mock_secret_key_2026",
};
