import { prisma } from "./prisma";
import { PRODUCTS } from "@/data/products";
import {
  DEFAULT_CUSTOMIZATION_CONFIG,
  calculateCustomizationPrice,
} from "@/data/customization";
import { CART_CONFIG, PromoCode } from "@/config/cart";
import { toPaise } from "@/config/site";
import {
  DrinkCustomizationSelection,
  OrderItemSnapshot,
} from "@/types";
import { Prisma } from "@prisma/client";

export interface RawCheckoutItem {
  productId: string;
  customization: DrinkCustomizationSelection;
  quantity: number;
}

export interface ServerPricingResult {
  items: OrderItemSnapshot[];
  subtotalPaise: number;
  discountPaise: number;
  appliedPromo: PromoCode | null;
  promoOfferId?: string | null;
  promoCode: string | null;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
}

/**
 * Authoritatively calculates all prices and tax on the server using PostgreSQL database records.
 * Verifies live product availability, customization add-on prices, active promotional offers,
 * and current inventory stock levels.
 */
export async function calculateDatabaseOrderPricing(
  rawItems: RawCheckoutItem[],
  promoCodeInput?: string | null,
  tx?: Prisma.TransactionClient
): Promise<ServerPricingResult> {
  const db = tx || prisma;

  if (!rawItems || rawItems.length === 0) {
    throw new Error("Order must contain at least one item.");
  }

  // Fetch all customization options from database
  const dbCustomizations = await db.customizationOption.findMany({
    where: { isAvailable: true },
  });

  const orderItems: OrderItemSnapshot[] = [];
  let subtotalPaise = 0;

  for (const rawItem of rawItems) {
    const product = await db.product.findUnique({
      where: { id: rawItem.productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      throw new Error(`Product not found or unavailable: ${rawItem.productId}`);
    }

    // Check inventory stock
    const quantity = Math.max(1, Math.min(50, Math.floor(rawItem.quantity || 1)));
    if (product.inventory) {
      const availableStock = product.inventory.stockCount - product.inventory.reservedCount;
      if (availableStock < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Only ${Math.max(0, availableStock)} available.`
        );
      }
    }

    const customization = rawItem.customization;

    // Validate size selection
    const sizeOption = dbCustomizations.find(
      (opt) =>
        opt.type === "SIZE" &&
        opt.code === customization.size &&
        (!opt.productId || opt.productId === product.id)
    );
    if (!sizeOption) {
      throw new Error(`Invalid or unavailable size '${customization.size}' for ${product.name}`);
    }

    // Validate milk selection
    const milkOption = dbCustomizations.find(
      (opt) =>
        opt.type === "MILK" &&
        opt.code === customization.milk &&
        (!opt.productId || opt.productId === product.id)
    );
    if (!milkOption) {
      throw new Error(`Invalid or unavailable milk option '${customization.milk}' for ${product.name}`);
    }

    // Validate sweetness selection
    const sweetnessOption = dbCustomizations.find(
      (opt) =>
        opt.type === "SWEETNESS" &&
        opt.code === customization.sweetness &&
        (!opt.productId || opt.productId === product.id)
    );
    if (!sweetnessOption) {
      throw new Error(`Invalid or unavailable sweetness '${customization.sweetness}' for ${product.name}`);
    }

    // Validate toppings
    let toppingsExtraPaise = 0;
    if (customization.toppings && customization.toppings.length > 0) {
      for (const topping of customization.toppings) {
        const topOption = dbCustomizations.find(
          (opt) =>
            opt.type === "TOPPING" &&
            opt.code === topping &&
            (!opt.productId || opt.productId === product.id)
        );
        if (!topOption) {
          throw new Error(`Invalid or unavailable topping '${topping}' for ${product.name}`);
        }
        toppingsExtraPaise += topOption.pricePaise;
      }
    }

    const customExtraPaise =
      sizeOption.pricePaise +
      milkOption.pricePaise +
      sweetnessOption.pricePaise +
      toppingsExtraPaise;

    const unitPricePaise = product.pricePaise + customExtraPaise;
    const lineTotalPaise = unitPricePaise * quantity;

    subtotalPaise += lineTotalPaise;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      productImage: product.image || undefined,
      basePrice: product.price,
      customization: {
        ...customization,
        customizationPrice: customExtraPaise / 100,
        unitPrice: unitPricePaise / 100,
      },
      unitPricePaise,
      quantity,
      lineTotalPaise,
    });
  }

  // Authoritative Promo calculation from database
  let appliedPromo: PromoCode | null = null;
  let promoOfferId: string | null = null;
  let discountPaise = 0;
  const normalizedCode = (promoCodeInput || "").trim().toUpperCase();

  if (normalizedCode) {
    const dbPromo = await db.promotionalOffer.findUnique({
      where: { code: normalizedCode },
    });

    if (dbPromo && dbPromo.isActive) {
      const now = new Date();
      if (dbPromo.validFrom > now || (dbPromo.validTo && dbPromo.validTo < now)) {
        throw new Error(`Promo code ${normalizedCode} is expired or not yet active.`);
      }

      if (dbPromo.usageLimit && dbPromo.timesUsed >= dbPromo.usageLimit) {
        throw new Error(`Promo code ${normalizedCode} has reached its maximum redemption limit.`);
      }

      if (dbPromo.minOrderPaise && subtotalPaise < dbPromo.minOrderPaise) {
        throw new Error(
          `Promo code ${dbPromo.code} requires a minimum order of ₹${(dbPromo.minOrderPaise / 100).toFixed(0)}`
        );
      }

      const totalItemCount = orderItems.reduce((acc, i) => acc + i.quantity, 0);
      if (dbPromo.minItems && totalItemCount < dbPromo.minItems) {
        throw new Error(
          `Promo code ${dbPromo.code} requires at least ${dbPromo.minItems} drinks in your cart.`
        );
      }

      promoOfferId = dbPromo.id;
      appliedPromo = {
        code: dbPromo.code,
        description: dbPromo.description,
        type:
          dbPromo.discountType === "PERCENTAGE"
            ? "percentage"
            : dbPromo.discountType === "FIXED"
            ? "fixed"
            : "free_shipping",
        value: dbPromo.discountValue,
        minOrderPaise: dbPromo.minOrderPaise || undefined,
        minItems: dbPromo.minItems || undefined,
      };

      if (dbPromo.discountType === "PERCENTAGE") {
        discountPaise = Math.round((subtotalPaise * dbPromo.discountValue) / 100);
        if (dbPromo.maxDiscountPaise && discountPaise > dbPromo.maxDiscountPaise) {
          discountPaise = dbPromo.maxDiscountPaise;
        }
      } else if (dbPromo.discountType === "FIXED") {
        discountPaise = Math.min(subtotalPaise, dbPromo.discountValue);
      } else if (dbPromo.discountType === "FREE_SHIPPING") {
        discountPaise = 0;
      }
    } else {
      throw new Error(`Invalid or inactive promo code: ${promoCodeInput}`);
    }
  }

  // Delivery fee logic
  let deliveryFeePaise = CART_CONFIG.standardDeliveryPaise;
  if (
    (appliedPromo && appliedPromo.type === "free_shipping") ||
    subtotalPaise >= CART_CONFIG.freeDeliveryThresholdPaise
  ) {
    deliveryFeePaise = 0;
  }

  // Tax calculation (5% GST on net beverage amount)
  const netTaxablePaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round(netTaxablePaise * CART_CONFIG.gstRate);
  const totalPaise = netTaxablePaise + deliveryFeePaise + taxPaise;

  return {
    items: orderItems,
    subtotalPaise,
    discountPaise,
    appliedPromo,
    promoOfferId,
    promoCode: appliedPromo ? appliedPromo.code : null,
    deliveryFeePaise,
    taxPaise,
    totalPaise,
  };
}

/**
 * Fallback / synchronous in-memory calculation (matches static product list)
 */
export function calculateServerOrderPricing(
  rawItems: RawCheckoutItem[],
  promoCodeInput?: string | null
): ServerPricingResult {
  if (!rawItems || rawItems.length === 0) {
    throw new Error("Order must contain at least one item.");
  }

  const orderItems: OrderItemSnapshot[] = [];
  let subtotalPaise = 0;

  for (const rawItem of rawItems) {
    const product = PRODUCTS.find((p) => p.id === rawItem.productId);
    if (!product) {
      throw new Error(`Product not found with ID: ${rawItem.productId}`);
    }

    const config = product.customizationConfig || DEFAULT_CUSTOMIZATION_CONFIG;
    const customization = rawItem.customization;

    const sizeOption = config.sizes.find((s) => s.id === customization.size);
    if (!sizeOption || sizeOption.isAvailable === false) {
      throw new Error(`Invalid or unavailable size '${customization.size}' for ${product.name}`);
    }

    const milkOption = config.milks.find((m) => m.id === customization.milk);
    if (!milkOption || milkOption.isAvailable === false) {
      throw new Error(`Invalid or unavailable milk option '${customization.milk}' for ${product.name}`);
    }

    const sweetnessOption = config.sweetness.find((s) => s.id === customization.sweetness);
    if (!sweetnessOption || sweetnessOption.isAvailable === false) {
      throw new Error(`Invalid or unavailable sweetness '${customization.sweetness}' for ${product.name}`);
    }

    if (customization.toppings && customization.toppings.length > 0) {
      for (const topping of customization.toppings) {
        const topOption = config.toppings.find((t) => t.id === topping);
        if (!topOption || topOption.isAvailable === false) {
          throw new Error(`Invalid or unavailable topping '${topping}' for ${product.name}`);
        }
      }
    }

    const customExtraRupees = calculateCustomizationPrice(config, customization);
    const unitPriceRupees = product.price + customExtraRupees;
    const unitPricePaise = toPaise(unitPriceRupees);

    const quantity = Math.max(1, Math.min(50, Math.floor(rawItem.quantity || 1)));
    const lineTotalPaise = unitPricePaise * quantity;

    subtotalPaise += lineTotalPaise;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.price,
      customization: {
        ...customization,
        customizationPrice: customExtraRupees,
        unitPrice: unitPriceRupees,
      },
      unitPricePaise,
      quantity,
      lineTotalPaise,
    });
  }

  let appliedPromo: PromoCode | null = null;
  let discountPaise = 0;
  const normalizedCode = (promoCodeInput || "").trim().toUpperCase();

  if (normalizedCode) {
    const promo = CART_CONFIG.validPromoCodes.find(
      (p) => p.code.toUpperCase() === normalizedCode
    );

    if (promo) {
      if (promo.minOrderPaise && subtotalPaise < promo.minOrderPaise) {
        throw new Error(
          `Promo code ${promo.code} requires a minimum order of ₹${(promo.minOrderPaise / 100).toFixed(0)}`
        );
      }

      const totalItemCount = orderItems.reduce((acc, i) => acc + i.quantity, 0);
      if (promo.minItems && totalItemCount < promo.minItems) {
        throw new Error(
          `Promo code ${promo.code} requires at least ${promo.minItems} drinks in your cart.`
        );
      }

      appliedPromo = promo;

      if (promo.type === "percentage") {
        discountPaise = Math.round((subtotalPaise * promo.value) / 100);
      } else if (promo.type === "fixed") {
        discountPaise = Math.min(subtotalPaise, promo.value);
      } else if (promo.type === "free_shipping") {
        discountPaise = 0;
      }
    } else {
      throw new Error(`Invalid promo code: ${promoCodeInput}`);
    }
  }

  let deliveryFeePaise = CART_CONFIG.standardDeliveryPaise;
  if (
    (appliedPromo && appliedPromo.type === "free_shipping") ||
    subtotalPaise >= CART_CONFIG.freeDeliveryThresholdPaise
  ) {
    deliveryFeePaise = 0;
  }

  const netTaxablePaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round(netTaxablePaise * CART_CONFIG.gstRate);
  const totalPaise = netTaxablePaise + deliveryFeePaise + taxPaise;

  return {
    items: orderItems,
    subtotalPaise,
    discountPaise,
    appliedPromo,
    promoCode: appliedPromo ? appliedPromo.code : null,
    deliveryFeePaise,
    taxPaise,
    totalPaise,
  };
}
