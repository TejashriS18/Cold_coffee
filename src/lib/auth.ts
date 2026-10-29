import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { AdminRole } from "@prisma/client";
import { logger } from "./logger";

const JWT_SECRET =
  process.env.JWT_SECRET || "frost_and_bean_secure_jwt_secret_key_2026_super_safe";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: AdminRole | "CUSTOMER";
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole | "CUSTOMER";
  mobile?: string;
  address?: string | null;
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against bcrypt hash
 */
export async function verifyPassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Signs a JWT with standard expiry (24h default)
 */
export function signJwt(
  payload: AuthTokenPayload,
  expiresIn: string | number = "24h"
): string {
  // @ts-expect-error jsonwebtoken types support string | number for expiresIn
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (err) {
    logger.debug("JWT verification failed", "Auth", err);
    return null;
  }
}

/**
 * Extracts bearer token from Authorization header or cookie
 */
export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Check cookie as fallback
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/fb_auth_token=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

/**
 * Authenticates an incoming API request and enforces role-based access control
 */
export async function authenticateRequest(
  req: Request,
  allowedRoles?: (AdminRole | "CUSTOMER")[]
): Promise<{ user: AuthenticatedUser | null; errorResponse?: Response }> {
  const token = extractTokenFromHeader(req);

  if (!token) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({
          success: false,
          message: "Authentication required. Please provide a valid Bearer token.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or expired authentication session.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(payload.role);
    if (!hasRole) {
      logger.warn(
        `Unauthorized access attempt: user ${payload.email} with role ${payload.role} attempted to access restricted endpoint`,
        "Auth"
      );
      return {
        user: null,
        errorResponse: new Response(
          JSON.stringify({
            success: false,
            message: "Forbidden: You do not have sufficient permissions to perform this action.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ),
      };
    }
  }

  // Fetch active user from database to ensure account hasn't been disabled
  if (payload.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, mobile: true, address: true },
    });

    if (!customer) {
      return {
        user: null,
        errorResponse: new Response(
          JSON.stringify({ success: false, message: "Customer account not found." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        ),
      };
    }

    return {
      user: {
        id: customer.id,
        email: customer.email || "",
        name: customer.name,
        role: "CUSTOMER",
        mobile: customer.mobile,
        address: customer.address,
      },
    };
  } else {
    // Admin user
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      return {
        user: null,
        errorResponse: new Response(
          JSON.stringify({ success: false, message: "Admin account is inactive or not found." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        ),
      };
    }

    return {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }
}
