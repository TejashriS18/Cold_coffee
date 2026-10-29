import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { AdminRole } from "@prisma/client";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  const { user, errorResponse } = await authenticateRequest(req, [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.MANAGER,
    AdminRole.BARISTA,
  ]);

  if (errorResponse) return errorResponse;

  return NextResponse.json({
    success: true,
    admin: user,
  });
}
