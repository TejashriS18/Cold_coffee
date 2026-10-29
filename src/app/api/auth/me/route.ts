import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { user, errorResponse } = await authenticateRequest(req, ["CUSTOMER"]);
    if (errorResponse) return errorResponse;

    // Fetch customer profile with their orders
    const customer = await prisma.customer.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: true,
            payments: { take: 1, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (err) {
    logger.error("Fetch customer profile error", "CustomerProfileAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customer profile." },
      { status: 500 }
    );
  }
}
