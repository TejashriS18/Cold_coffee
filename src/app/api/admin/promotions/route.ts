import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole } from "@prisma/client";
import { CreatePromotionSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const { errorResponse } = await authenticateRequest(req, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.MANAGER,
    ]);

    if (errorResponse) return errorResponse;

    const promotions = await prisma.promotionalOffer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      promotions,
    });
  } catch (err) {
    logger.error("Failed to fetch promotions", "PromotionsAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve promotional offers." },
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
    const parseResult = CreatePromotionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.format() },
        { status: 400 }
      );
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderPaise,
      minItems,
      maxDiscountPaise,
      usageLimit,
    } = parseResult.data;

    // Check unique code
    const existing = await prisma.promotionalOffer.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Promo code '${code}' already exists.` },
        { status: 409 }
      );
    }

    const promo = await prisma.promotionalOffer.create({
      data: {
        code,
        description,
        discountType,
        discountValue,
        minOrderPaise,
        minItems,
        maxDiscountPaise: maxDiscountPaise || null,
        usageLimit: usageLimit || null,
        isActive: true,
      },
    });

    logger.info(`Promotional offer '${code}' created by admin ${user?.email}`, "PromotionsAPI");

    return NextResponse.json({
      success: true,
      promotion: promo,
    });
  } catch (err) {
    logger.error("Failed to create promotion", "PromotionsAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "Failed to create promotional offer." },
      { status: 500 }
    );
  }
}
