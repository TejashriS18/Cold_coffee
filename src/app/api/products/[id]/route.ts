import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { AdminRole } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        category: true,
        inventory: true,
        customizationOptions: {
          where: { isAvailable: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const availableStock = product.inventory
      ? Math.max(0, product.inventory.stockCount - product.inventory.reservedCount)
      : 100;

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        availableStock,
        inStock: availableStock > 0 && (product.inventory?.isAvailable ?? true),
      },
    });
  } catch (err) {
    logger.error("Failed to fetch product details", "ProductsAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve product details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ]);

    if (errorResponse) return errorResponse;

    const body = await req.json();

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.tagline ? { tagline: body.tagline } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.price !== undefined
          ? {
              price: Number(body.price),
              pricePaise: Math.round(Number(body.price) * 100),
            }
          : {}),
        ...(body.origin ? { origin: body.origin } : {}),
        ...(body.categoryId ? { categoryId: body.categoryId } : {}),
        ...(body.roastLevel ? { roastLevel: body.roastLevel } : {}),
        ...(body.brewMethod ? { brewMethod: body.brewMethod } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
        ...(body.intensity !== undefined ? { intensity: Number(body.intensity) } : {}),
        ...(body.isBestSeller !== undefined ? { isBestSeller: Boolean(body.isBestSeller) } : {}),
        ...(body.isLimitedRelease !== undefined ? { isLimitedRelease: Boolean(body.isLimitedRelease) } : {}),
        ...(body.image !== undefined ? { image: body.image } : {}),
        ...(body.accentColor !== undefined ? { accentColor: body.accentColor } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });

    logger.info(`Product updated: ${updated.name} by admin ${user?.email}`, "ProductsAPI");

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (err) {
    logger.error("Failed to update product", "ProductsAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to update product." },
      { status: 500 }
    );
  }
}
