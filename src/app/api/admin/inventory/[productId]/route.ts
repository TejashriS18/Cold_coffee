import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole } from "@prisma/client";
import { UpdateInventorySchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { user, errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.MANAGER,
    ]);

    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parseResult = UpdateInventorySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { stockCount, reservedCount, lowStockThreshold, isAvailable } = parseResult.data;

    const existing = await prisma.inventory.findUnique({
      where: { productId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Inventory for product ${productId} not found.` },
        { status: 404 }
      );
    }

    const updated = await prisma.inventory.update({
      where: { productId },
      data: {
        ...(stockCount !== undefined
          ? { stockCount, lastRestockedAt: new Date() }
          : {}),
        ...(reservedCount !== undefined ? { reservedCount } : {}),
        ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
        ...(isAvailable !== undefined ? { isAvailable } : {}),
      },
      include: {
        product: { select: { name: true } },
      },
    });

    logger.info(
      `Inventory for ${updated.product.name} (${productId}) updated by admin ${user?.email}. Stock: ${updated.stockCount}`,
      "InventoryAPI"
    );

    return NextResponse.json({
      success: true,
      message: `Inventory for ${updated.product.name} updated successfully.`,
      inventory: updated,
    });
  } catch (err) {
    logger.error("Failed to update inventory", "InventoryAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to update inventory record." },
      { status: 500 }
    );
  }
}
