import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const { errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.MANAGER,
      AdminRole.BARISTA,
    ]);

    if (errorResponse) return errorResponse;

    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { stockCount: "asc" },
    });

    const report = inventory.map((inv) => ({
      id: inv.id,
      productId: inv.productId,
      productName: inv.product.name,
      category: inv.product.category.name,
      price: inv.product.price,
      stockCount: inv.stockCount,
      reservedCount: inv.reservedCount,
      availableCount: Math.max(0, inv.stockCount - inv.reservedCount),
      lowStockThreshold: inv.lowStockThreshold,
      isLowStock: inv.stockCount <= inv.lowStockThreshold,
      isAvailable: inv.isAvailable,
      lastRestockedAt: inv.lastRestockedAt,
    }));

    return NextResponse.json({
      success: true,
      inventory: report,
    });
  } catch (err) {
    logger.error("Failed to fetch inventory report", "InventoryAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve inventory." },
      { status: 500 }
    );
  }
}
