import { NextResponse } from "next/server";
import { getOrderById, verifyAndUpdatePayment } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/payment-gateway";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, status, failureReason } = body as {
      orderId?: string;
      paymentId?: string;
      signature?: string;
      status?: "success" | "failed" | "cancelled";
      failureReason?: string;
    };

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // 1. Idempotency Check
    if (order.orderStatus === "confirmed" && order.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment is already verified and order is confirmed.",
        orderId: order.orderId,
      });
    }

    // 2. Handle Failed or Cancelled Payment Simulation
    if (status === "failed" || status === "cancelled") {
      const reason =
        failureReason ||
        (status === "cancelled"
          ? "Payment cancelled by user."
          : "Bank card declined or transaction timed out.");

      await verifyAndUpdatePayment(orderId, {
        gateway: "mock",
        transactionReference: paymentId,
        paymentSignature: signature,
        status: "failed",
        failureReason: reason,
      });

      return NextResponse.json({
        success: false,
        message: reason,
        orderId,
        canRetry: true,
      });
    }

    // 3. For Success Status, Cryptographically Verify the Signature
    if (status === "success") {
      if (!paymentId || !signature) {
        return NextResponse.json(
          { success: false, message: "Missing paymentId or signature for verification." },
          { status: 400 }
        );
      }

      const isValid = verifyPaymentSignature(orderId, paymentId, signature);
      if (!isValid) {
        logger.warn(
          `[SECURITY ALERT] Invalid payment signature attempt for order ${orderId}`,
          "PaymentVerification"
        );
        return NextResponse.json(
          { success: false, message: "Payment verification failed: Invalid transaction signature." },
          { status: 400 }
        );
      }

      // Mark order as paid and confirmed in database transaction
      const updateResult = await verifyAndUpdatePayment(orderId, {
        gateway: "mock",
        transactionReference: paymentId,
        paymentSignature: signature,
        status: "success",
      });

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully.",
        orderId: updateResult.order.orderId,
      });
    }

    return NextResponse.json(
      { success: false, message: "Unsupported payment status." },
      { status: 400 }
    );
  } catch (err: unknown) {
    logger.error("Payment verification unexpected error", "PaymentVerificationAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Internal server error during payment verification." },
      { status: 500 }
    );
  }
}
