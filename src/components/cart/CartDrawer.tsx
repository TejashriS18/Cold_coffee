"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Edit3,
  Tag,
  Truck,
  Coffee,
  Info,
} from "lucide-react";

import { CartItem } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/common/Button";
import { formatPaise, formatPrice } from "@/config/site";
import { CART_CONFIG } from "@/config/cart";
import { ProductQuickViewModal } from "@/components/menu/ProductQuickViewModal";

export function CartDrawer() {
  const {
    items,
    totalCount,
    subtotalPaise,
    discountPaise,
    taxPaise,
    deliveryFeePaise,
    totalPaise,
    appliedPromo,
    promoError,
    applyPromoCode,
    removePromoCode,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    updateCartItemCustomization,
  } = useCart();
  const router = useRouter();

  const [promoInput, setPromoInput] = useState("");
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyPromoCode(promoInput)) {
      setPromoInput("");
    }
  };

  // Free delivery calculation
  const remainingForFreeDeliveryPaise = Math.max(
    0,
    CART_CONFIG.freeDeliveryThresholdPaise - subtotalPaise
  );
  const qualifiesForFreeDelivery =
    subtotalPaise >= CART_CONFIG.freeDeliveryThresholdPaise ||
    appliedPromo?.type === "free_shipping";

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Your Shopping Bag"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#3B241A]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={closeCart}
          aria-hidden="true"
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <div className="w-screen max-w-md bg-[#F6F0E7] shadow-2xl flex flex-col justify-between border-l border-[#3B241A]/10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#3B241A]/10 px-6 py-4.5 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B241A] text-white shadow-xs">
                  <ShoppingBag className="h-4 w-4 text-[#C58A4A]" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#3B241A] leading-tight">
                    Your Cold Order
                  </h2>
                  <span className="text-xs text-[#6F4935] font-medium">
                    {totalCount} {totalCount === 1 ? "drink" : "drinks"} selected
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCart}
                className="rounded-full p-2 text-[#6F4935] hover:bg-[#F6F0E7] hover:text-[#3B241A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A]"
                aria-label="Close cart drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Delivery Progress Bar */}
            {items.length > 0 && (
              <div className="border-b border-[#3B241A]/10 bg-[#FBF8F3] px-6 py-3">
                <div className="flex items-center justify-between text-xs font-medium text-[#3B241A] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[#C58A4A]" />
                    {qualifiesForFreeDelivery
                      ? "Free Express Delivery unlocked!"
                      : `Add ${formatPaise(remainingForFreeDeliveryPaise)} more for Free Delivery`}
                  </span>
                  <span className="font-serif font-bold text-[#C58A4A]">
                    {qualifiesForFreeDelivery ? "FREE" : "₹40"}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EAE0D0] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C58A4A] to-[#8F5A23] rounded-full transition-all duration-300"
                    style={{
                      width: qualifiesForFreeDelivery
                        ? "100%"
                        : `${Math.min(
                            100,
                            (subtotalPaise / CART_CONFIG.freeDeliveryThresholdPaise) * 100
                          )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Items List / Empty State */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {items.length === 0 ? (
                /* Empty Cart State with Illustration */
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  {/* Empty Glass Illustration */}
                  <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-white border border-[#3B241A]/10 shadow-sm">
                    <div className="relative flex flex-col items-center">
                      <div className="h-16 w-10 rounded-b-xl border-2 border-dashed border-[#6F4935]/40 flex flex-col items-center justify-end p-1">
                        <div className="h-3 w-7 rounded-sm bg-[#C58A4A]/20" />
                        <div className="h-2 w-5 rounded-xs bg-[#6F4935]/20 mt-1" />
                      </div>
                      <div className="h-1.5 w-12 rounded-full bg-[#3B241A]/10 mt-2" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#C58A4A] text-white">
                      <Coffee className="h-3.5 w-3.5" />
                    </span>

                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#3B241A]">
                    Your Glass is Empty
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-[#6F4935] max-w-xs leading-relaxed">
                    Explore our 24-hour slow-steeped cold brews, nitro specials, and signature caramel iced coffees.
                  </p>

                  <Button
                    variant="primary"
                    size="md"
                    className="mt-6 px-6 shadow-sm"
                    onClick={() => {
                      closeCart();
                      const el = document.getElementById("menu");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                /* Cart Items List */
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#3B241A]/10 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Thumbnail */}
                      <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-[#F6F0E7] border border-[#3B241A]/5">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-serif text-xs font-bold text-[#3B241A]">
                            F&B
                          </div>
                        )}
                      </div>

                      {/* Details & Customization */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif text-sm font-bold text-[#3B241A] truncate">
                            {item.product.name}
                          </h4>
                          <span className="font-serif text-sm font-bold text-[#3B241A] shrink-0">
                            {formatPrice(item.customization.unitPrice * item.quantity)}
                          </span>
                        </div>

                        {/* Selected Options Summary Tags */}
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                          <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5 font-bold text-[#3B241A]">
                            {item.customization.size}
                          </span>
                          <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5 text-[#6F4935]">
                            {item.customization.milk}
                          </span>
                          <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5 text-[#6F4935]">
                            {item.customization.sweetness} Sweet
                          </span>
                          {item.customization.toppings.map((top) => (
                            <span
                              key={top}
                              className="rounded bg-[#C58A4A]/10 px-1.5 py-0.5 font-semibold text-[#8F5A23] border border-[#C58A4A]/25"
                            >
                              +{top}
                            </span>
                          ))}
                        </div>

                        <span className="mt-1 block text-[11px] text-[#6F4935]">
                          {formatPrice(item.customization.unitPrice)} each
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Row: Edit & Quantity Controls */}
                    <div className="flex items-center justify-between border-t border-[#3B241A]/5 pt-2.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F4935] hover:text-[#C58A4A] transition-colors"
                        title="Edit drink options"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-full border border-[#3B241A]/15 bg-[#F6F0E7]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:text-[#C58A4A] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-[#3B241A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:text-[#C58A4A] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-[#6F4935]/60 hover:text-red-700 transition-colors"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary with Promo Code & Breakdown */}
            {items.length > 0 && (
              <div className="border-t border-[#3B241A]/10 bg-white p-5 sm:p-6 space-y-4 shadow-xl">
                {/* Promo Code Input or Applied Badge */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-900">
                          {appliedPromo.code}
                        </span>{" "}
                        <span className="text-emerald-700">applied</span>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          {appliedPromo.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="rounded-full p-1 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      aria-label="Remove promo code"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F4935]/60 pointer-events-none" />
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="Promo code (CHILL20, FROSTDUO...)"
                          className="w-full rounded-full border border-[#3B241A]/15 bg-[#F6F0E7] py-2 pl-9 pr-3 text-xs uppercase font-medium text-[#3B241A] placeholder-[#6F4935]/50 focus:border-[#C58A4A] focus:outline-none focus:bg-white transition-all"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        className="px-4 py-2 text-xs"
                      >
                        Apply
                      </Button>
                    </div>

                    {promoError && (
                      <p className="text-[11px] text-red-600 font-medium pl-2">
                        {promoError}
                      </p>
                    )}
                  </form>
                )}

                {/* Financial Breakdown (Integer Paise Calculated) */}
                <div className="space-y-2 border-t border-[#3B241A]/10 pt-3 text-xs text-[#6F4935]">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#3B241A]">
                      {formatPaise(subtotalPaise)}
                    </span>
                  </div>

                  {discountPaise > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Discount ({appliedPromo?.code})</span>
                      <span>-{formatPaise(discountPaise)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>Delivery Fee</span>
                      {deliveryFeePaise === 0 && (
                        <span className="rounded-full bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-800">
                          FREE
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-[#3B241A]">
                      {deliveryFeePaise === 0 ? "₹0" : formatPaise(deliveryFeePaise)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>GST (5%)</span>
                      <Info className="h-3 w-3 text-[#6F4935]/50" />
                    </span>
                    <span className="font-medium text-[#3B241A]">
                      {formatPaise(taxPaise)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#3B241A]/10 pt-2.5 text-sm">
                    <span className="font-bold text-[#3B241A]">Total Amount</span>
                    <span className="font-serif text-xl font-bold text-[#3B241A]">
                      {formatPaise(totalPaise)}
                    </span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center shadow-sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => {
                    closeCart();
                    router.push("/checkout");
                  }}
                >
                  Proceed to Checkout • {formatPaise(totalPaise)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Customization Modal */}
      {editingItem && (
        <ProductQuickViewModal
          key={editingItem.id}
          product={editingItem.product}
          isOpen={true}
          isEditing={true}
          editingCartItemId={editingItem.id}
          initialCustomization={editingItem.customization}
          initialQuantity={editingItem.quantity}
          onClose={() => setEditingItem(null)}
          onAddToCart={() => {}}
          onUpdateCartItem={(cartItemId, newCustomization, qty) => {
            updateCartItemCustomization(cartItemId, newCustomization, qty);
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
}
