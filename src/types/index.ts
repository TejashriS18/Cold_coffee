export type RoastLevel = "Light" | "Medium" | "Dark";

export type BrewMethod =
  | "Slow Steeped 24h"
  | "Nitro Infused"
  | "Flash Chilled"
  | "Cold Distilled"
  | "Signature Shaken";

export type ProductCategory = "Classic" | "Chocolate" | "Caramel" | "Special";

export type MenuFilterCategory = "All" | ProductCategory;

// Customization Types
export type CupSize = "Regular" | "Large";

export type MilkOption =
  | "Regular Milk"
  | "Oat Milk"
  | "Almond Milk"
  | "Soy Milk"
  | "None / Black";

export type SweetnessLevel = "Less" | "Regular" | "Extra";

export type DrinkTopping =
  | "Whipped Cream"
  | "Chocolate Drizzle"
  | "Extra Coffee Shot"
  | "Caramel Drizzle";

export interface CustomizationOption<T> {
  id: T;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface ProductCustomizationConfig {
  sizes: CustomizationOption<CupSize>[];
  milks: CustomizationOption<MilkOption>[];
  sweetness: CustomizationOption<SweetnessLevel>[];
  toppings: CustomizationOption<DrinkTopping>[];
}

export interface DrinkCustomizationSelection {
  size: CupSize;
  milk: MilkOption;
  sweetness: SweetnessLevel;
  toppings: DrinkTopping[];
  customizationPrice: number;
  unitPrice: number;
}

export interface TastingNote {
  name: string;
  category: "fruity" | "chocolaty" | "nutty" | "floral" | "spicy" | "creamy";
}

export interface CoffeeProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  origin: string;
  category: ProductCategory;
  roastLevel: RoastLevel;
  brewMethod: BrewMethod;
  notes: string[];
  intensity: number; // 1 to 5
  isBestSeller?: boolean;
  isLimitedRelease?: boolean;
  image?: string;
  accentColor?: string;
  customizationConfig?: ProductCustomizationConfig;
}

export interface CartItem {
  id: string; // Unique hash based on product.id + customization
  product: CoffeeProduct;
  customization: DrinkCustomizationSelection;
  quantity: number;
}

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface BrandFeature {
  title: string;
  description: string;
  iconName: "ThermometerSnowflake" | "Clock" | "Sparkles" | "Droplets" | "ShieldCheck" | "Leaf";
}

// Checkout & Order Management Types
export type PaymentMethod = "online" | "cod";

export type PaymentStatus = "pending" | "paid" | "failed" | "cod_pending";

export type OrderStatus =
  | "created"
  | "confirmed"
  | "preparing"
  | "payment_failed"
  | "cancelled";

export interface CustomerDetails {
  name: string;
  mobile: string;
  address: string;
  instructions?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  productImage?: string;
  basePrice: number;
  customization: DrinkCustomizationSelection;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface PaymentDetails {
  gateway: "mock" | "cod";
  transactionId?: string;
  paymentSignature?: string;
  failureReason?: string;
  paidAt?: string;
}

export interface OrderRecord {
  orderId: string;
  customer: CustomerDetails;
  items: OrderItemSnapshot[];
  subtotalPaise: number;
  discountPaise: number;
  promoCode: string | null;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentDetails?: PaymentDetails;
  createdAt: string;
  updatedAt: string;
}
