import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        productCount: c._count.products,
      })),
    });
  } catch (err) {
    logger.error("Failed to fetch categories", "CategoriesAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve categories." },
      { status: 500 }
    );
  }
}
