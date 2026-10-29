import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signJwt } from "@/lib/auth";
import { CustomerLoginSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = CustomerLoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || !customer.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, customer.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = signJwt({
      userId: customer.id,
      email: customer.email || "",
      name: customer.name,
      role: "CUSTOMER",
    });

    logger.info(`Customer login successful: ${customer.email}`, "CustomerAuth");

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address,
      },
    });
  } catch (err) {
    logger.error("Customer login error", "CustomerAuth", undefined, err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
