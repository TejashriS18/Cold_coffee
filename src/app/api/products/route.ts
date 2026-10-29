import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { AdminRole } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categorySlug = url.searchParams.get("category");
    const bestSellersOnly = url.searchParams.get("bestSellers") === "true";

    const where: any = { isActive: true };
    if (categorySlug && categorySlug.toLowerCase() !== "all") {
      where.category = { slug: categorySlug.toLowerCase() };
    }
    if (bestSellersOnly) {
      where.isBestSeller = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: {
          select: {
            stockCount: true,
            reservedCount: true,
            isAvailable: true,
          },
        },
        customizationOptions: {
          where: { isAvailable: true },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Format products with available stock calculation
    const formatted = products.map((p) => {
      const stock = p.inventory
        ? Math.max(0, p.inventory.stockCount - p.inventory.reservedCount)
        : 100;

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        price: p.price,
        origin: p.origin,
        category: p.category.name,
        categorySlug: p.category.slug,
        roastLevel: p.roastLevel,
        brewMethod: p.brewMethod,
        notes: p.notes,
        intensity: p.intensity,
        isBestSeller: p.isBestSeller,
        isLimitedRelease: p.isLimitedRelease,
        image: p.image,
        accentColor: p.accentColor,
        inStock: stock > 0 && (p.inventory ? p.inventory.isAvailable : true),
        availableStock: stock,
      };
    });

    return NextResponse.json({
      success: true,
      products: formatted,
    });
  } catch (err) {
    logger.error("Failed to fetch products", "ProductsAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve products." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user, errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ]);

    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      id,
      name,
      tagline,
      description,
      price,
      origin,
      categoryId,
      roastLevel,
      brewMethod,
      notes,
      intensity,
      isBestSeller,
      isLimitedRelease,
      image,
      accentColor,
      initialStock = 100,
    } = body;

    if (!id || !name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Missing required product fields." },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          id,
          slug: id,
          name,
          tagline: tagline || "",
          description: description || "",
          price: Number(price),
          pricePaise: Math.round(Number(price) * 100),
          origin: origin || "Single Origin Blend",
          categoryId,
          roastLevel: roastLevel || "Medium",
          brewMethod: brewMethod || "Slow Steeped 24h",
          notes: Array.isArray(notes) ? notes : [],
          intensity: intensity ? Number(intensity) : 3,
          isBestSeller: Boolean(isBestSeller),
          isLimitedRelease: Boolean(isLimitedRelease),
          image: image || null,
          accentColor: accentColor || null,
        },
      });

      await tx.inventory.create({
        data: {
          productId: product.id,
          stockCount: Number(initialStock),
          reservedCount: 0,
          lowStockThreshold: 10,
          isAvailable: true,
        },
      });

      return product;
    });

    logger.info(`Product created: ${created.name} by admin ${user?.email}`, "ProductsAPI");

    return NextResponse.json({
      success: true,
      product: created,
    });
  } catch (err) {
    logger.error("Failed to create product", "ProductsAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to create product." },
      { status: 500 }
    );
  }
}
