import { NextResponse } from "next/server";
import { generatePaymentSignature } from "@/lib/payment-gateway";
import { getOrderById } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, action } = body as {
      orderId?: string;
      action?: "success" | "fail" | "cancel";
    };

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required." },
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

    if (action === "cancel") {
      return NextResponse.json({
        success: false,
        status: "cancelled",
        message: "Payment cancelled by user.",
      });
    }

    if (action === "fail") {
      return NextResponse.json({
        success: false,
        status: "failed",
        failureReason: "Payment declined by issuing bank. Card has insufficient funds (Mock Simulation).",
      });
    }

    // Generate mock payment ID and valid server-signed signature
    const paymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signature = generatePaymentSignature(orderId, paymentId);

    return NextResponse.json({
      success: true,
      status: "success",
      paymentId,
      signature,
    });
  } catch (err: unknown) {
    console.error("Mock gateway processing error:", err);
    return NextResponse.json(
      { success: false, message: "Mock gateway processing error." },
      { status: 500 }
    );
  }
}
