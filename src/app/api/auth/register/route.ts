import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signJwt } from "@/lib/auth";
import { CustomerRegisterSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = CustomerRegisterSchema.safeParse(body);

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const { name, email, password, mobile, address } = parseResult.data;

    // Check if customer email already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        address: address || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        createdAt: true,
      },
    });

    const token = signJwt({
      userId: customer.id,
      email: customer.email || "",
      name: customer.name,
      role: "CUSTOMER",
    });

    logger.info(`Customer registered successfully: ${customer.email}`, "CustomerAuth");

    return NextResponse.json({
      success: true,
      message: "Registration successful.",
      token,
      customer,
    });
  } catch (err) {
    logger.error("Customer registration error", "CustomerAuth", undefined, err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
