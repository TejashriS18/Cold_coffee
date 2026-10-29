import { NextResponse } from "next/server";
import { CHECKOUT_CONFIG } from "@/config/checkout";
import { calculateDatabaseOrderPricing, RawCheckoutItem } from "@/lib/server-pricing";
import { createOrderInDatabase } from "@/lib/orders";
import { generatePaymentOrderToken } from "@/lib/payment-gateway";
import { CustomerDetails, PaymentMethod } from "@/types";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, items, promoCode, paymentMethod, idempotencyKey } = body as {
      customer?: CustomerDetails;
      items?: RawCheckoutItem[];
      promoCode?: string | null;
      paymentMethod?: PaymentMethod;
      idempotencyKey?: string | null;
    };

    // 1. Validate customer details
    const fieldErrors: Record<string, string> = {};

    if (!customer?.name || customer.name.trim().length < 2) {
      fieldErrors.name = "Please enter your full name (minimum 2 characters).";
    }

    const cleanMobile = (customer?.mobile || "").trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      fieldErrors.mobile = "Please enter a valid 10-digit Indian mobile number.";
    }

    if (!customer?.address || customer.address.trim().length < 10) {
      fieldErrors.address = "Please enter a complete delivery address (minimum 10 characters).";
    }

    if (!paymentMethod || (paymentMethod !== "online" && paymentMethod !== "cod")) {
      fieldErrors.paymentMethod = "Please select a valid payment method.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { success: false, errors: fieldErrors },
        { status: 400 }
      );
    }

    // 2. Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Your order must contain at least one item." },
        { status: 400 }
      );
    }

    // 3. Pre-calculate pricing to validate COD threshold before creating order
    let pricing;
    try {
      pricing = await calculateDatabaseOrderPricing(items, promoCode);
    } catch (pricingErr: unknown) {
      const msg = pricingErr instanceof Error ? pricingErr.message : "Price calculation failed.";
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    // 4. Validate COD rules if Cash on Delivery is selected
    if (paymentMethod === "cod") {
      if (!CHECKOUT_CONFIG.isCodEnabled) {
        return NextResponse.json(
          { success: false, message: "Cash on delivery is currently unavailable." },
          { status: 400 }
        );
      }
      if (pricing.totalPaise > CHECKOUT_CONFIG.maxCodOrderPaise) {
        return NextResponse.json(
          {
            success: false,
            message: `Cash on delivery is only available for orders up to ₹${(CHECKOUT_CONFIG.maxCodOrderPaise / 100).toFixed(0)}.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Create Order in PostgreSQL inside an atomic database transaction
    const sanitizedCustomer: CustomerDetails = {
      name: customer!.name.trim(),
      mobile: cleanMobile,
      address: customer!.address.trim(),
      instructions: customer!.instructions?.trim() || "",
    };

    const { order, isDuplicate } = await createOrderInDatabase({
      customer: sanitizedCustomer,
      items,
      paymentMethod: paymentMethod!,
      promoCode,
      idempotencyKey: idempotencyKey || null,
    });

    // 6. Response for Online Payment
    if (paymentMethod === "online") {
      const paymentOrderToken = generatePaymentOrderToken(order.orderId, order.totalPaise);
      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        paymentMethod: "online",
        orderStatus: order.orderStatus,
        totalPaise: order.totalPaise,
        paymentOrderToken,
        gateway: "mock",
        isDuplicate,
      });
    }

    // 7. Response for COD Payment
    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      paymentMethod: "cod",
      orderStatus: order.orderStatus,
      totalPaise: order.totalPaise,
      isDuplicate,
    });
  } catch (err: unknown) {
    logger.error("Order creation unexpected error", "CreateOrderAPI", undefined, err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while creating your order." },
      { status: 500 }
    );
  }
}
