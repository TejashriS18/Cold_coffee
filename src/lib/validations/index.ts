import { z } from "zod";

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const CustomerDetailsSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Please enter your full name (minimum 2 characters).")
    .max(100, "Name cannot exceed 100 characters."),
  mobile: z
    .string({ error: "Mobile number is required" })
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (val) => INDIAN_MOBILE_REGEX.test(val),
      "Please enter a valid 10-digit Indian mobile number."
    ),
  address: z
    .string({ error: "Delivery address is required" })
    .trim()
    .min(10, "Please enter a complete delivery address (minimum 10 characters).")
    .max(500, "Delivery address cannot exceed 500 characters."),
  instructions: z
    .string()
    .max(500, "Special instructions cannot exceed 500 characters.")
    .optional()
    .default(""),
});

export const DrinkCustomizationSchema = z.object({
  size: z.enum(["Regular", "Large"]),
  milk: z.enum([
    "Regular Milk",
    "Oat Milk",
    "Almond Milk",
    "Soy Milk",
    "None / Black",
  ]),
  sweetness: z.enum(["Less", "Regular", "Extra"]),
  toppings: z.array(
    z.enum([
      "Whipped Cream",
      "Chocolate Drizzle",
      "Extra Coffee Shot",
      "Caramel Drizzle",
    ])
  ).default([]),
});

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  customization: DrinkCustomizationSchema,
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(50, "Quantity cannot exceed 50 units per line item"),
});

export const CreateOrderSchema = z.object({
  customer: CustomerDetailsSchema,
  items: z
    .array(CheckoutItemSchema)
    .min(1, "Your order must contain at least one item."),
  paymentMethod: z.enum(["online", "cod"], {
    error: "Please select a valid payment method (online or cod).",
  }),
  promoCode: z.string().trim().nullable().optional(),
  idempotencyKey: z.string().trim().optional(),
});

export const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
  status: z.enum(["success", "failed", "cancelled"]),
  failureReason: z.string().optional(),
});

export const AdminLoginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const CustomerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  mobile: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (val) => INDIAN_MOBILE_REGEX.test(val),
      "Please enter a valid 10-digit Indian mobile number."
    ),
  address: z.string().trim().min(10, "Address must be at least 10 characters.").optional(),
});

export const CustomerLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const UpdateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    "CREATED",
    "CONFIRMED",
    "PREPARING",
    "DELIVERED",
    "CANCELLED",
    "PAYMENT_FAILED",
  ]),
  paymentStatus: z
    .enum(["PENDING", "PAID", "FAILED", "REFUNDED", "COD_PENDING"])
    .optional(),
  failureReason: z.string().optional(),
});

export const UpdateInventorySchema = z.object({
  stockCount: z.number().int().min(0).optional(),
  reservedCount: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export const CreatePromotionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .transform((s) => s.toUpperCase()),
  description: z.string().trim().min(5),
  discountType: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.number().int().min(0),
  minOrderPaise: z.number().int().min(0).optional().default(0),
  minItems: z.number().int().min(0).optional().default(0),
  maxDiscountPaise: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
});
