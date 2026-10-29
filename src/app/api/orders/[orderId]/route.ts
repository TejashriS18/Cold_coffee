import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
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

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: unknown) {
    console.error("Fetch order unexpected error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}
