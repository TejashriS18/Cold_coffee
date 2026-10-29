import crypto from "crypto";
import { CHECKOUT_CONFIG } from "@/config/checkout";

/**
 * Creates a signed order token for initiating payment with the mock gateway.
 */
export function generatePaymentOrderToken(orderId: string, amountPaise: number): string {
  const secret = CHECKOUT_CONFIG.paymentGatewaySecret;
  const payload = `${orderId}|${amountPaise}|${Date.now()}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `fb_tok_${Buffer.from(payload).toString("base64url")}.${hmac.substring(0, 16)}`;
}

/**
 * Generates an HMAC-SHA256 signature for a mock payment transaction.
 * In a real Razorpay / Stripe gateway integration, this signature is generated
 * by the payment gateway and verified on the server with the gateway secret.
 */
export function generatePaymentSignature(orderId: string, paymentId: string): string {
  const secret = CHECKOUT_CONFIG.paymentGatewaySecret;
  const payload = `${orderId}|${paymentId}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Cryptographically verifies that the received payment transaction signature matches
 * the expected HMAC signature computed with our server-only secret.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!orderId || !paymentId || !signature) return false;

  const expectedSignature = generatePaymentSignature(orderId, paymentId);

  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
