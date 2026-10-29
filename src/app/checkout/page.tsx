"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Clock,
  Tag,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CustomerDetails, PaymentMethod } from "@/types";
import { formatPaise, formatPrice } from "@/config/site";
import { CHECKOUT_CONFIG } from "@/config/checkout";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { MockPaymentModal } from "@/components/checkout/MockPaymentModal";

export default function CheckoutPage() {
  const router = useRouter();
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
    clearCart,
    isHydrated,
  } = useCart();

  // Customer form state
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    mobile: "",
    address: "",
    instructions: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo code input state
  const [promoInput, setPromoInput] = useState("");
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  // Online Mock Gateway Modal State
  const [activePendingOrderId, setActivePendingOrderId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Preload saved customer info from localStorage if available
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedInfo = localStorage.getItem("frost_customer_profile");
        if (savedInfo) {
          const parsed = JSON.parse(savedInfo);
          if (parsed && typeof parsed === "object") {
            setCustomer((prev) => ({
              ...prev,
              name: parsed.name || "",
              mobile: parsed.mobile || "",
              address: parsed.address || "",
            }));
          }
        }
      } catch {
        // Ignore parse errors
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = applyPromoCode(promoInput.trim());
    if (success) {
      setPromoSuccessMsg(`Coupon ${promoInput.trim().toUpperCase()} applied!`);
      setPromoInput("");
      setTimeout(() => setPromoSuccessMsg(null), 4000);
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customer.name.trim()) {
      newErrors.name = "Full name is required.";
    } else if (customer.name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters.";
    }

    const cleanMobile = customer.mobile.replace(/\D/g, "");
    if (!cleanMobile) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobile = "Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).";
    }

    if (!customer.address.trim()) {
      newErrors.address = "Delivery address is required.";
    } else if (customer.address.trim().length < 10) {
      newErrors.address = "Please include building/flat, street, and area (minimum 10 characters).";
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError("Your cart is empty. Please add items to proceed.");
      return;
    }

    const isValid = validateAllFields();
    if (!isValid) {
      setSubmitError("Please correct the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save customer profile for convenience
      try {
        localStorage.setItem(
          "frost_customer_profile",
          JSON.stringify({
            name: customer.name,
            mobile: customer.mobile,
            address: customer.address,
          })
        );
      } catch {
        // Ignore local storage error
      }

      // 1. Call server to create order & recalculate prices
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map((item) => ({
            productId: item.product.id,
            customization: item.customization,
            quantity: item.quantity,
          })),
          promoCode: appliedPromo?.code || null,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setSubmitError(data.message || "Failed to create order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const orderId = data.orderId;

      // 2. Handle Cash on Delivery flow
      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/checkout/confirmation/${orderId}`);
        return;
      }

      // 3. Handle Online Mock Payment flow
      if (paymentMethod === "online") {
        setActivePendingOrderId(orderId);
        setIsPaymentModalOpen(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      setSubmitError("Network error. Unable to connect to checkout service.");
      setIsSubmitting(false);
    }
  };

  // Mock Gateway: Simulate Success flow
  const handlePaymentSuccess = async () => {
    if (!activePendingOrderId) return;
    try {
      // Step A: Request signed mock transaction from mock gateway
      const mockRes = await fetch("/api/checkout/mock-gateway/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activePendingOrderId,
          action: "success",
        }),
      });
      const mockData = await mockRes.json();

      if (!mockData.success) {
        throw new Error(mockData.message || "Mock gateway generation error");
      }

      // Step B: Send transaction to server verification endpoint
      const verifyRes = await fetch("/api/checkout/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activePendingOrderId,
          paymentId: mockData.paymentId,
          signature: mockData.signature,
          status: "success",
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setIsPaymentModalOpen(false);
        clearCart();
        router.push(`/checkout/confirmation/${activePendingOrderId}`);
      } else {
        throw new Error(verifyData.message || "Payment verification failed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment error";
      alert(`Payment verification error: ${msg}`);
    }
  };

  // Mock Gateway: Simulate Failure flow
  const handlePaymentFailure = async (reason: string) => {
    if (!activePendingOrderId) return;
    try {
      await fetch("/api/checkout/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activePendingOrderId,
          status: "failed",
          failureReason: reason,
        }),
      });

      setIsPaymentModalOpen(false);
      // Route to confirmation screen which will show Failed status and Retry option
      router.push(`/checkout/confirmation/${activePendingOrderId}`);
    } catch (err) {
      console.error("Payment failure reporting error:", err);
    }
  };

  // Mock Gateway: Cancel flow
  const handlePaymentCancel = () => {
    setIsPaymentModalOpen(false);
    setSubmitError(
      "Payment simulation cancelled. Your cart and order details have been preserved."
    );
  };

  // Empty Cart State
  if (isHydrated && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F0E7] pt-28 pb-16">
        <Container size="sm">
          <div className="rounded-3xl bg-white p-8 sm:p-12 text-center shadow-warm-md border border-[#3B241A]/10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#3B241A]/5 text-[#3B241A] mb-5">
              <ShoppingBag className="h-10 w-10 text-[#C58A4A]" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A]">
              Your Cart is Empty
            </h1>
            <p className="mt-2 text-sm text-[#6F4935] max-w-md mx-auto">
              You haven&apos;t added any cold brews or nitro drinks to your cart yet. Explore our handcrafted artisanal collection to begin.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/#menu">
                <Button variant="primary" size="lg" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Explore Our Menu
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F0E7] pt-24 pb-20">
      <Container size="xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/#menu"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6F4935] hover:text-[#3B241A] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#6F4935] font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>256-Bit Encrypted Secure Checkout</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B241A]">
            Complete Your Order
          </h1>
          <p className="mt-1 text-sm text-[#6F4935]">
            Artisanal single-origin cold coffees brewed slow, delivered cold.
          </p>
        </div>

        {/* Global Submit Error Banner */}
        {submitError && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to complete checkout</p>
              <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Main Checkout Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7">
            <CheckoutForm
              customer={customer}
              setCustomer={setCustomer}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              totalPaise={totalPaise}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          {/* Right Column: Order Summary & Review */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-warm-md border border-[#3B241A]/10 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-[#3B241A]/10">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#C58A4A]" />
                  <h2 className="font-serif text-lg font-bold text-[#3B241A]">
                    Order Summary
                  </h2>
                </div>
                <span className="rounded-full bg-[#3B241A]/5 px-2.5 py-0.5 text-xs font-bold text-[#3B241A]">
                  {totalCount} {totalCount === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#3B241A]/5 my-3 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#3B241A]/10 bg-[#F6F0E7]">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#6F4935]">
                          ☕
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 rounded-tl-lg bg-[#3B241A] px-1.5 py-0.5 text-[10px] font-bold text-[#F6F0E7]">
                        ×{item.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-bold text-[#3B241A] truncate">
                          {item.product.name}
                        </h4>
                        <span className="text-sm font-bold text-[#3B241A] shrink-0">
                          {formatPrice(
                            (item.product.price + item.customization.customizationPrice) *
                              item.quantity
                          )}
                        </span>
                      </div>

                      {/* Customization Badges */}
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-[#6F4935]">
                        <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5 font-medium text-[#3B241A]">
                          {item.customization.size}
                        </span>
                        <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5">
                          {item.customization.milk}
                        </span>
                        <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5">
                          {item.customization.sweetness} Sweet
                        </span>
                        {item.customization.toppings &&
                          item.customization.toppings.map((top) => (
                            <span
                              key={top}
                              className="rounded bg-[#C58A4A]/10 px-1.5 py-0.5 text-[#3B241A]"
                            >
                              +{top}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="border-t border-[#3B241A]/10 pt-4">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo Code (e.g. CHILL20)"
                      className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2 pl-3 pr-2 text-xs font-mono uppercase text-[#3B241A] placeholder:text-[#6F4935]/40 focus:border-[#3B241A] focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={!promoInput.trim()}
                    className="shrink-0"
                  >
                    Apply
                  </Button>
                </form>

                {promoError && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{promoError}</p>
                )}
                {promoSuccessMsg && (
                  <p className="mt-1.5 text-xs text-emerald-700 font-medium">
                    {promoSuccessMsg}
                  </p>
                )}

                {appliedPromo && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 border border-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-mono font-bold">{appliedPromo.code}</span>
                      <span className="text-[11px] text-emerald-700 opacity-90">
                        ({appliedPromo.description})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Breakdown Table */}
              <div className="border-t border-[#3B241A]/10 pt-4 mt-4 space-y-2 text-xs text-[#6F4935]">
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
                  <span>Delivery Fee</span>
                  <span className="font-medium text-[#3B241A]">
                    {deliveryFeePaise === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-[11px]">
                        Free
                      </span>
                    ) : (
                      formatPaise(deliveryFeePaise)
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>GST (5%)</span>
                    <Info className="h-3 w-3 text-[#6F4935]/50" />
                  </span>
                  <span className="font-medium text-[#3B241A]">{formatPaise(taxPaise)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-[#3B241A]/10 pt-3 text-sm">
                  <span className="font-bold text-[#3B241A]">Final Payable</span>
                  <span className="font-serif text-2xl font-bold text-[#3B241A]">
                    {formatPaise(totalPaise)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center shadow-warm-md"
                  rightIcon={
                    isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )
                  }
                  onClick={handlePlaceOrder}
                >
                  {isSubmitting
                    ? "Securing Order..."
                    : paymentMethod === "online"
                    ? `Proceed to Payment • ${formatPaise(totalPaise)}`
                    : `Confirm Order (COD) • ${formatPaise(totalPaise)}`}
                </Button>
              </div>

              {/* Delivery ETA Notice */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6F4935] border-t border-[#3B241A]/5 pt-3">
                <Clock className="h-3.5 w-3.5 text-[#C58A4A]" />
                <span>
                  Estimated delivery in {CHECKOUT_CONFIG.estimatedDeliveryMinutesMin}–
                  {CHECKOUT_CONFIG.estimatedDeliveryMinutesMax} minutes.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Online Mock Payment Simulator Modal */}
      {activePendingOrderId && (
        <MockPaymentModal
          isOpen={isPaymentModalOpen}
          orderId={activePendingOrderId}
          totalPaise={totalPaise}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
