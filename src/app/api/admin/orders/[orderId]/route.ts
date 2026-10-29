import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole, OrderLifecycleStatus, OrderPaymentStatus, PaymentRecordStatus } from "@prisma/client";
import { UpdateOrderStatusSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { user, errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.MANAGER,
    ]);

    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parseResult = UpdateOrderStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { orderStatus, paymentStatus, failureReason } = parseResult.data;

    // Check order existence
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: orderId }, { id: orderId }],
      },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    // Run status update and inventory compensation if cancelled
    const updated = await prisma.$transaction(async (tx) => {
      // If transitioning to CANCELLED from a non-cancelled state, restore inventory stock
      if (
        orderStatus === "CANCELLED" &&
        existingOrder.orderStatus !== OrderLifecycleStatus.CANCELLED
      ) {
        for (const item of existingOrder.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { stockCount: { increment: item.quantity } },
          });
        }
      }

      // Update Order
      const updatedOrder = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          orderStatus: orderStatus as OrderLifecycleStatus,
          ...(paymentStatus ? { paymentStatus: paymentStatus as OrderPaymentStatus } : {}),
        },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      // If payment status changed, record payment entry
      if (paymentStatus) {
        await tx.payment.create({
          data: {
            orderId: existingOrder.id,
            gateway: updatedOrder.paymentMethod === "COD" ? "cod" : "admin_override",
            amountPaise: updatedOrder.totalPaise,
            status: paymentStatus as PaymentRecordStatus,
            failureReason: failureReason || null,
            verifiedAt: paymentStatus === "PAID" ? new Date() : null,
          },
        });
      }

      return updatedOrder;
    });

    logger.info(
      `Order ${existingOrder.orderNumber} updated to status: ${orderStatus} by admin ${user?.email}`,
      "AdminOrdersAPI"
    );

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${orderStatus}.`,
      order: updated,
    });
  } catch (err) {
    logger.error("Failed to update order status", "AdminOrdersAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to update order." },
      { status: 500 }
    );
  }
}
