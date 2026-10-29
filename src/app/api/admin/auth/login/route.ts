import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signJwt } from "@/lib/auth";
import { AdminLoginSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = AdminLoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      logger.warn(`Failed admin login attempt for email: ${email}`, "AdminAuth");
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, admin.passwordHash);
    if (!isMatch) {
      logger.warn(`Failed admin password verification for email: ${email}`, "AdminAuth");
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signJwt({
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    logger.info(`Admin login successful: ${admin.email} (Role: ${admin.role})`, "AdminAuth");

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    logger.error("Admin login error", "AdminAuth", undefined, err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during admin authentication." },
      { status: 500 }
    );
  }
}
