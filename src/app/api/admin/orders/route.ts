import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole, OrderLifecycleStatus, OrderPaymentStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.MANAGER,
      AdminRole.BARISTA,
    ]);

    if (errorResponse) return errorResponse;

    const url = new URL(req.url);
    const orderStatus = url.searchParams.get("orderStatus") as OrderLifecycleStatus | null;
    const paymentStatus = url.searchParams.get("paymentStatus") as OrderPaymentStatus | null;
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (orderStatus) where.orderStatus = orderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerMobile: { contains: search } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    logger.error("Failed to fetch admin orders", "AdminOrdersAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve orders." },
      { status: 500 }
    );
  }
}
