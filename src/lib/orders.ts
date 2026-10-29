import { prisma } from "./prisma";
import {
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  PaymentDetails,
  CustomerDetails,
  PaymentMethod,
} from "@/types";
import { calculateDatabaseOrderPricing, RawCheckoutItem } from "./server-pricing";
import { logger } from "./logger";
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderLifecycleStatus,
  PaymentRecordStatus,
  Prisma,
} from "@prisma/client";

/**
 * Generates a human-friendly unique order ID in format FB-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // 4-character random alphanumeric string
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FB-${dateStr}-${randomChars}`;
}

/**
 * Converts a database Order with relations into a client-safe OrderRecord
 */
function mapPrismaOrderToOrderRecord(order: {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  deliveryInstructions: string | null;
  subtotalPaise: number;
  discountPaise: number;
  promoCode: string | null;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderLifecycleStatus;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string | null;
    basePricePaise: number;
    customizationJson: Prisma.JsonValue;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
  }>;
  payments: Array<{
    gateway: string;
    transactionReference: string | null;
    paymentSignature: string | null;
    failureReason: string | null;
    verifiedAt: Date | null;
    createdAt: Date;
  }>;
}): OrderRecord {
  const latestPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

  return {
    orderId: order.orderNumber,
    customer: {
      name: order.customerName,
      mobile: order.customerMobile,
      address: order.customerAddress,
      instructions: order.deliveryInstructions || undefined,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage || undefined,
      basePrice: item.basePricePaise / 100,
      customization: item.customizationJson as any,
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
      lineTotalPaise: item.lineTotalPaise,
    })),
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise,
    promoCode: order.promoCode,
    deliveryFeePaise: order.deliveryFeePaise,
    taxPaise: order.taxPaise,
    totalPaise: order.totalPaise,
    paymentMethod: order.paymentMethod === "COD" ? "cod" : "online",
    paymentStatus:
      order.paymentStatus === "PAID"
        ? "paid"
        : order.paymentStatus === "FAILED"
        ? "failed"
        : order.paymentStatus === "COD_PENDING"
        ? "cod_pending"
        : "pending",
    orderStatus:
      order.orderStatus === "CONFIRMED"
        ? "confirmed"
        : order.orderStatus === "PREPARING"
        ? "preparing"
        : order.orderStatus === "CANCELLED"
        ? "cancelled"
        : order.orderStatus === "PAYMENT_FAILED"
        ? "payment_failed"
        : "created",
    paymentDetails: latestPayment
      ? {
          gateway: latestPayment.gateway as "mock" | "cod",
          transactionId: latestPayment.transactionReference || undefined,
          paymentSignature: latestPayment.paymentSignature || undefined,
          failureReason: latestPayment.failureReason || undefined,
          paidAt: latestPayment.verifiedAt ? latestPayment.verifiedAt.toISOString() : undefined,
        }
      : undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

/**
 * Retrieves a single order by either orderNumber (e.g. FB-20261019-XXXX) or Prisma cuid
 */
export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: orderId, mode: "insensitive" } },
          { id: orderId },
        ],
      },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) return null;

    return mapPrismaOrderToOrderRecord(order);
  } catch (err) {
    logger.error("Failed to retrieve order by ID", "OrderService", { orderId }, err);
    return null;
  }
}

/**
 * Retrieves all orders with optional status filters and pagination
 */
export async function getAllOrders(options?: {
  limit?: number;
  skip?: number;
  orderStatus?: OrderLifecycleStatus;
  paymentStatus?: OrderPaymentStatus;
}): Promise<OrderRecord[]> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        orderStatus: options?.orderStatus,
        paymentStatus: options?.paymentStatus,
      },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.skip || 0,
    });

    return orders.map(mapPrismaOrderToOrderRecord);
  } catch (err) {
    logger.error("Failed to fetch all orders", "OrderService", undefined, err);
    return [];
  }
}

export interface CreateOrderParams {
  customer: CustomerDetails;
  items: RawCheckoutItem[];
  paymentMethod: PaymentMethod;
  promoCode?: string | null;
  idempotencyKey?: string | null;
}

/**
 * Creates a new order atomically in a PostgreSQL transaction:
 * 1. Checks Idempotency: Returns existing order if idempotency key was previously processed
 * 2. Authoritatively calculates prices from database products, customizations, and promos
 * 3. Verifies and decrements inventory
 * 4. Increments promo usage
 * 5. Finds or creates Customer
 * 6. Creates Order, OrderItems, and Payment record atomically
 */
export async function createOrderInDatabase(
  params: CreateOrderParams
): Promise<{ order: OrderRecord; isDuplicate: boolean; paymentTokenPayload?: { orderId: string; amountPaise: number } }> {
  const { customer, items, paymentMethod, promoCode, idempotencyKey } = params;

  // 1. Idempotency Check: prevent duplicate submissions
  if (idempotencyKey) {
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (existingOrder) {
      logger.info(
        `Idempotent replay detected for key: ${idempotencyKey}. Returning existing order ${existingOrder.orderNumber}`,
        "OrderService"
      );
      return {
        order: mapPrismaOrderToOrderRecord(existingOrder),
        isDuplicate: true,
      };
    }
  }

  // 2. Run order creation inside an atomic Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    // Authoritatively calculate prices from database
    const pricing = await calculateDatabaseOrderPricing(items, promoCode, tx);

    // Verify and decrement inventory stock
    for (const item of items) {
      const inv = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inv || !inv.isAvailable) {
        throw new Error(`Inventory item unavailable for product: ${item.productId}`);
      }

      if (inv.stockCount - inv.reservedCount < item.quantity) {
        throw new Error(`Insufficient stock for product ID: ${item.productId}`);
      }

      // Decrement available stock
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          stockCount: { decrement: item.quantity },
        },
      });
    }

    // Increment promo usage if applied
    if (pricing.promoOfferId) {
      await tx.promotionalOffer.update({
        where: { id: pricing.promoOfferId },
        data: {
          timesUsed: { increment: 1 },
        },
      });
    }

    // Upsert or find customer
    let dbCustomer = await tx.customer.findFirst({
      where: { mobile: customer.mobile },
    });

    if (!dbCustomer) {
      dbCustomer = await tx.customer.create({
        data: {
          name: customer.name.trim(),
          mobile: customer.mobile,
          address: customer.address.trim(),
        },
      });
    }

    const orderNumber = generateOrderNumber();
    const isCod = paymentMethod === "cod";

    const dbOrder = await tx.order.create({
      data: {
        orderNumber,
        idempotencyKey: idempotencyKey || null,
        customerId: dbCustomer.id,
        customerName: customer.name.trim(),
        customerMobile: customer.mobile,
        customerAddress: customer.address.trim(),
        deliveryInstructions: customer.instructions?.trim() || null,
        subtotalPaise: pricing.subtotalPaise,
        discountPaise: pricing.discountPaise,
        promoCode: pricing.promoCode,
        promoOfferId: pricing.promoOfferId || null,
        deliveryFeePaise: pricing.deliveryFeePaise,
        taxPaise: pricing.taxPaise,
        totalPaise: pricing.totalPaise,
        paymentMethod: isCod ? OrderPaymentMethod.COD : OrderPaymentMethod.ONLINE,
        paymentStatus: isCod ? OrderPaymentStatus.COD_PENDING : OrderPaymentStatus.PENDING,
        orderStatus: isCod ? OrderLifecycleStatus.CONFIRMED : OrderLifecycleStatus.CREATED,
        items: {
          create: pricing.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            productImage: i.productImage || null,
            basePricePaise: Math.round(i.basePrice * 100),
            customizationJson: i.customization as unknown as Prisma.InputJsonValue,
            unitPricePaise: i.unitPricePaise,
            quantity: i.quantity,
            lineTotalPaise: i.lineTotalPaise,
          })),
        },
        payments: {
          create: {
            gateway: isCod ? "cod" : "mock",
            transactionReference: isCod ? `cod_${orderNumber}` : null,
            amountPaise: pricing.totalPaise,
            status: isCod ? PaymentRecordStatus.COD_PENDING : PaymentRecordStatus.PENDING,
            verifiedAt: isCod ? new Date() : null,
          },
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return {
      order: mapPrismaOrderToOrderRecord(dbOrder),
      isDuplicate: false,
      totalPaise: pricing.totalPaise,
    };
  });

  logger.info(
    `Order successfully created: ${result.order.orderId} (Total: ₹${(result.totalPaise / 100).toFixed(2)})`,
    "OrderService"
  );

  return {
    order: result.order,
    isDuplicate: false,
    paymentTokenPayload: {
      orderId: result.order.orderId,
      amountPaise: result.totalPaise,
    },
  };
}

/**
 * Atomic payment verification and order status transition
 */
export async function verifyAndUpdatePayment(
  orderId: string,
  paymentDetails: {
    gateway: string;
    transactionReference?: string;
    paymentSignature?: string;
    status: "success" | "failed" | "cancelled";
    failureReason?: string;
    rawMetadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; order: OrderRecord; message: string }> {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: orderId, mode: "insensitive" } },
          { id: orderId },
        ],
      },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Idempotency: If already paid and confirmed, return existing state
    if (order.paymentStatus === OrderPaymentStatus.PAID && order.orderStatus === OrderLifecycleStatus.CONFIRMED) {
      return {
        success: true,
        order: mapPrismaOrderToOrderRecord(order),
        message: "Payment is already verified and order is confirmed.",
      };
    }

    if (paymentDetails.status === "success") {
      // 1. Create or update payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          gateway: paymentDetails.gateway,
          transactionReference: paymentDetails.transactionReference || null,
          paymentSignature: paymentDetails.paymentSignature || null,
          amountPaise: order.totalPaise,
          status: PaymentRecordStatus.PAID,
          verifiedAt: new Date(),
          rawMetadata: (paymentDetails.rawMetadata || {}) as Prisma.InputJsonValue,
        },
      });

      // 2. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderLifecycleStatus.CONFIRMED,
          paymentStatus: OrderPaymentStatus.PAID,
        },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      logger.info(
        `Payment verified and confirmed for order ${order.orderNumber}. Ref: ${paymentDetails.transactionReference}`,
        "PaymentVerification"
      );

      return {
        success: true,
        order: mapPrismaOrderToOrderRecord(updatedOrder),
        message: "Payment verified successfully.",
      };
    } else {
      // Failed or cancelled payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          gateway: paymentDetails.gateway,
          transactionReference: paymentDetails.transactionReference || null,
          amountPaise: order.totalPaise,
          status: PaymentRecordStatus.FAILED,
          failureReason: paymentDetails.failureReason || "Payment failed or was cancelled.",
        },
      });

      // Restore inventory stock
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            stockCount: { increment: item.quantity },
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderLifecycleStatus.PAYMENT_FAILED,
          paymentStatus: OrderPaymentStatus.FAILED,
        },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      logger.warn(
        `Payment failed for order ${order.orderNumber}. Reason: ${paymentDetails.failureReason}. Inventory restored.`,
        "PaymentVerification"
      );

      return {
        success: false,
        order: mapPrismaOrderToOrderRecord(updatedOrder),
        message: paymentDetails.failureReason || "Payment processing failed.",
      };
    }
  });
}

/**
 * Backward compatibility helpers matching legacy orders.ts exports
 */
export async function saveOrder(order: OrderRecord): Promise<OrderRecord> {
  const existing = await getOrderById(order.orderId);
  if (existing) {
    return existing;
  }
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: OrderStatus,
  paymentStatus?: PaymentStatus,
  paymentDetails?: PaymentDetails
): Promise<OrderRecord | null> {
  try {
    const statusMap: Record<OrderStatus, OrderLifecycleStatus> = {
      created: OrderLifecycleStatus.CREATED,
      confirmed: OrderLifecycleStatus.CONFIRMED,
      preparing: OrderLifecycleStatus.PREPARING,
      cancelled: OrderLifecycleStatus.CANCELLED,
      payment_failed: OrderLifecycleStatus.PAYMENT_FAILED,
    };

    const paymentStatusMap: Record<PaymentStatus, OrderPaymentStatus> = {
      pending: OrderPaymentStatus.PENDING,
      paid: OrderPaymentStatus.PAID,
      failed: OrderPaymentStatus.FAILED,
      cod_pending: OrderPaymentStatus.COD_PENDING,
    };

    const updated = await prisma.order.update({
      where: { orderNumber: orderId },
      data: {
        orderStatus: statusMap[orderStatus],
        ...(paymentStatus ? { paymentStatus: paymentStatusMap[paymentStatus] } : {}),
      },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (paymentDetails) {
      await prisma.payment.create({
        data: {
          orderId: updated.id,
          gateway: paymentDetails.gateway,
          transactionReference: paymentDetails.transactionId || null,
          paymentSignature: paymentDetails.paymentSignature || null,
          failureReason: paymentDetails.failureReason || null,
          amountPaise: updated.totalPaise,
          status:
            paymentStatus === "paid"
              ? PaymentRecordStatus.PAID
              : paymentStatus === "failed"
              ? PaymentRecordStatus.FAILED
              : PaymentRecordStatus.PENDING,
          verifiedAt: paymentDetails.paidAt ? new Date(paymentDetails.paidAt) : null,
        },
      });
    }

    return mapPrismaOrderToOrderRecord(updated);
  } catch (err) {
    logger.error("Failed to update order status", "OrderService", { orderId, orderStatus }, err);
    return null;
  }
}
