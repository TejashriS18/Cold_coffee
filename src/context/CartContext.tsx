"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { CoffeeProduct, CartItem, DrinkCustomizationSelection } from "@/types";
import { getDefaultCustomization } from "@/data/customization";
import { CART_CONFIG, PromoCode } from "@/config/cart";
import { toPaise } from "@/config/site";

const CART_STORAGE_KEY = "frost_and_bean_cart_v1";
const PROMO_STORAGE_KEY = "frost_and_bean_promo_v1";

interface CartContextType {
  items: CartItem[];
  totalCount: number;

  // Paise-based monetary values (integers)
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;

  // Rupee values for convenience
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;

  // Promo code state
  appliedPromo: PromoCode | null;
  promoError: string | null;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;

  // Cart operations
  addToCart: (
    product: CoffeeProduct,
    customization?: DrinkCustomizationSelection,
    quantity?: number
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateCartItemCustomization: (
    oldCartItemId: string,
    newCustomization: DrinkCustomizationSelection,
    quantity?: number
  ) => void;
  clearCart: () => void;

  // Drawer modal controls
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Editing state
  editingCartItem: CartItem | null;
  setEditingCartItem: (item: CartItem | null) => void;

  // Hydration indicator
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function generateCartItemId(
  productId: string,
  customization: DrinkCustomizationSelection
): string {
  const toppingsKey = (customization.toppings || []).slice().sort().join("-");
  return `${productId}_${customization.size}_${customization.milk}_${customization.sweetness}_${toppingsKey}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Load cart and promo from localStorage on client mount (Hydration-safe)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            // Validate and sanitize items
            const validItems = parsed.filter(
              (item: unknown): item is CartItem =>
                Boolean(
                  item &&
                    typeof item === "object" &&
                    "id" in item &&
                    "product" in item &&
                    "customization" in item &&
                    "quantity" in item &&
                    typeof (item as CartItem).quantity === "number" &&
                    (item as CartItem).quantity > 0
                )
            );
            setItems(validItems);
          }
        }

        const savedPromo = localStorage.getItem(PROMO_STORAGE_KEY);
        if (savedPromo) {
          const promo = CART_CONFIG.validPromoCodes.find(
            (p) => p.code.toUpperCase() === savedPromo.toUpperCase()
          );
          if (promo) {
            setAppliedPromo(promo);
          }
        }
      } catch {
        // Ignore local storage parse errors
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 2. Persist cart and promo to localStorage whenever items or promo change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      if (appliedPromo) {
        localStorage.setItem(PROMO_STORAGE_KEY, appliedPromo.code);
      } else {
        localStorage.removeItem(PROMO_STORAGE_KEY);
      }
    } catch {
      // Ignore write errors (e.g., private mode quota)
    }
  }, [items, appliedPromo, isHydrated]);

  // 3. Integer Paise Calculations
  const {
    totalCount,
    subtotalPaise,
    discountPaise,
    deliveryFeePaise,
    taxPaise,
    totalPaise,
  } = useMemo(() => {
    // Total drink quantity (prevent invalid / negative values)
    const count = items.reduce(
      (sum, item) => sum + Math.max(1, Math.floor(item.quantity || 1)),
      0
    );

    // Subtotal in paise: sum of (unitPrice in rupees -> paise) * quantity
    const subtotalInPaise = items.reduce((sum, item) => {
      const unitPaise = Math.max(0, toPaise(item.customization.unitPrice));
      const safeQty = Math.max(1, Math.min(50, Math.floor(item.quantity || 1)));
      return sum + unitPaise * safeQty;
    }, 0);

    // Calculate Promo Discount in paise
    let discPaise = 0;
    if (appliedPromo && subtotalInPaise > 0) {
      const meetsMinOrder =
        !appliedPromo.minOrderPaise ||
        subtotalInPaise >= appliedPromo.minOrderPaise;
      const meetsMinItems =
        !appliedPromo.minItems || count >= appliedPromo.minItems;

      if (meetsMinOrder && meetsMinItems) {
        if (appliedPromo.type === "percentage") {
          discPaise = Math.round((subtotalInPaise * appliedPromo.value) / 100);
        } else if (appliedPromo.type === "fixed") {
          discPaise = Math.min(subtotalInPaise, appliedPromo.value);
        }
      }
    }
    // Prevent negative discount or discount exceeding subtotal
    discPaise = Math.max(0, Math.min(subtotalInPaise, discPaise));

    // Net taxable beverage amount
    const netTaxablePaise = Math.max(0, subtotalInPaise - discPaise);

    // 5% GST in paise
    const gstPaise =
      items.length > 0 ? Math.round(netTaxablePaise * CART_CONFIG.gstRate) : 0;

    // Delivery Fee in paise
    let deliveryPaise = 0;
    if (items.length > 0) {
      const isFreeShippingPromo = appliedPromo?.type === "free_shipping";
      const qualifiesForFreeDelivery =
        subtotalInPaise >= CART_CONFIG.freeDeliveryThresholdPaise;

      if (!isFreeShippingPromo && !qualifiesForFreeDelivery) {
        deliveryPaise = CART_CONFIG.standardDeliveryPaise;
      }
    }

    // Final Total in paise
    const finalTotalPaise = Math.max(
      0,
      netTaxablePaise + deliveryPaise + gstPaise
    );

    return {
      totalCount: count,
      subtotalPaise: subtotalInPaise,
      discountPaise: discPaise,
      deliveryFeePaise: deliveryPaise,
      taxPaise: gstPaise,
      totalPaise: finalTotalPaise,
    };
  }, [items, appliedPromo]);

  // Convert paise to rupee floats for UI display
  const subtotal = subtotalPaise / 100;
  const discount = discountPaise / 100;
  const tax = taxPaise / 100;
  const deliveryFee = deliveryFeePaise / 100;
  const total = totalPaise / 100;

  // Promo code management
  const applyPromoCode = (inputCode: string): boolean => {
    setPromoError(null);
    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanCode) {
      setPromoError("Please enter a promo code.");
      return false;
    }

    const matchedPromo = CART_CONFIG.validPromoCodes.find(
      (p) => p.code === cleanCode
    );

    if (!matchedPromo) {
      setPromoError(`"${cleanCode}" is not a valid promo code.`);
      return false;
    }

    if (
      matchedPromo.minOrderPaise &&
      subtotalPaise < matchedPromo.minOrderPaise
    ) {
      const minRequiredRupees = matchedPromo.minOrderPaise / 100;
      setPromoError(
        `Code ${matchedPromo.code} requires a minimum order of ₹${minRequiredRupees}.`
      );
      return false;
    }

    if (matchedPromo.minItems && totalCount < matchedPromo.minItems) {
      setPromoError(
        `Code ${matchedPromo.code} requires at least ${matchedPromo.minItems} drinks in your cart.`
      );
      return false;
    }

    setAppliedPromo(matchedPromo);
    setPromoError(null);
    return true;
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Cart operations
  const addToCart = (
    product: CoffeeProduct,
    customization?: DrinkCustomizationSelection,
    quantity: number = 1
  ) => {
    const finalCustomization =
      customization ||
      (() => {
        const def = getDefaultCustomization(product.customizationConfig);
        return {
          ...def,
          unitPrice: Math.max(0, product.price + def.customizationPrice),
        };
      })();

    // Ensure valid quantity (1 to 50)
    const safeQty = Math.max(1, Math.min(50, Math.floor(quantity)));
    const itemId = generateCartItemId(product.id, finalCustomization);

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        return prevItems.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: Math.min(50, item.quantity + safeQty) }
            : item
        );
      }
      return [
        ...prevItems,
        {
          id: itemId,
          product,
          customization: finalCustomization,
          quantity: safeQty,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    const safeQty = Math.floor(newQuantity);
    if (safeQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    // Cap at 50 drinks per line item to prevent invalid overflow
    const cappedQty = Math.min(50, safeQty);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity: cappedQty } : item
      )
    );
  };

  const updateCartItemCustomization = (
    oldCartItemId: string,
    newCustomization: DrinkCustomizationSelection,
    newQuantity?: number
  ) => {
    setItems((prevItems) => {
      const oldItem = prevItems.find((item) => item.id === oldCartItemId);
      if (!oldItem) return prevItems;

      const safeQty =
        newQuantity !== undefined
          ? Math.max(1, Math.min(50, Math.floor(newQuantity)))
          : oldItem.quantity;

      const newItemId = generateCartItemId(oldItem.product.id, newCustomization);

      // Remove the old item
      const remainingItems = prevItems.filter((item) => item.id !== oldCartItemId);

      // If item with new customization already exists, merge quantities
      const existingIndex = remainingItems.findIndex((item) => item.id === newItemId);
      if (existingIndex > -1) {
        return remainingItems.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: Math.min(50, item.quantity + safeQty) }
            : item
        );
      }

      return [
        ...remainingItems,
        {
          id: newItemId,
          product: oldItem.product,
          customization: newCustomization,
          quantity: safeQty,
        },
      ];
    });

    setEditingCartItem(null);
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
    setPromoError(null);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // Close cart on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotalPaise,
        discountPaise,
        taxPaise,
        deliveryFeePaise,
        totalPaise,
        subtotal,
        discount,
        tax,
        deliveryFee,
        total,
        appliedPromo,
        promoError,
        applyPromoCode,
        removePromoCode,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItemCustomization,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        editingCartItem,
        setEditingCartItem,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
