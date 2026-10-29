"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Banknote,
  RotateCcw,
  Printer,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { OrderRecord } from "@/types";
import { formatPaise } from "@/config/site";
import { CHECKOUT_CONFIG } from "@/config/checkout";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { MockPaymentModal } from "@/components/checkout/MockPaymentModal";

interface ContentProps {
  params: Promise<{ orderId: string }>;
}

export function OrderConfirmationContent({ params }: ContentProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Retry modal state
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);

  const reloadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || "Failed to load order details.");
      }
    } catch {
      setError("Unable to connect to order server.");
    }
  }, [orderId]);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.message || "Failed to load order details.");
        }
      })
      .catch(() => {
        if (isMounted) setError("Unable to connect to order server.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Retry payment simulation handlers
  const handleRetrySuccess = async () => {
    if (!order) return;
    try {
      const mockRes = await fetch("/api/checkout/mock-gateway/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          action: "success",
        }),
      });
      const mockData = await mockRes.json();

      const verifyRes = await fetch("/api/checkout/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          paymentId: mockData.paymentId,
          signature: mockData.signature,
          status: "success",
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setIsRetryModalOpen(false);
        reloadOrder();
      } else {
        alert(verifyData.message || "Retry verification failed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      alert(`Payment retry error: ${msg}`);
    }
  };

  const handleRetryFailure = async (reason: string) => {
    if (!order) return;
    await fetch("/api/checkout/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.orderId,
        status: "failed",
        failureReason: reason,
      }),
    });
    setIsRetryModalOpen(false);
    reloadOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F0E7] flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C58A4A] mx-auto" />
          <p className="text-sm font-medium text-[#3B241A]">
            Retrieving order confirmation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F6F0E7] pt-28 pb-16">
        <Container size="sm">
          <div className="rounded-3xl bg-white p-8 sm:p-12 text-center shadow-warm-md border border-[#3B241A]/10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#3B241A]">
              Order Not Found
            </h1>
            <p className="mt-2 text-sm text-[#6F4935]">
              {error || `We could not find an order matching reference "${orderId}".`}
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/">
                <Button variant="primary" size="md">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "paid";
  const isCod = order.paymentMethod === "cod";
  const isFailed = order.paymentStatus === "failed" || order.orderStatus === "payment_failed";

  return (
    <div className="min-h-screen bg-[#F6F0E7] pt-24 pb-20">
      <Container size="md">
        {/* Status Header Banner */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-warm-md border border-[#3B241A]/10 text-center mb-6">
          {isPaid && (
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Payment Verified & Order Confirmed
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A]">
                Thank You, {order.customer.name}!
              </h1>
              <p className="text-sm text-[#6F4935] max-w-md mx-auto">
                Your artisanal cold brew order has been received and sent to our baristas for fresh extraction.
              </p>
            </div>
          )}

          {isCod && (
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Banknote className="h-9 w-9" />
              </div>
              <span className="inline-block rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
                Cash on Delivery • Order Confirmed
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A]">
                Order Confirmed, {order.customer.name}!
              </h1>
              <p className="text-sm text-[#6F4935] max-w-md mx-auto">
                Please keep exact cash of{" "}
                <span className="font-bold text-[#3B241A]">{formatPaise(order.totalPaise)}</span>{" "}
                ready upon delivery.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <XCircle className="h-9 w-9" />
              </div>
              <span className="inline-block rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
                Payment Attempt Declined
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A]">
                Payment Could Not Be Verified
              </h1>
              <p className="text-sm text-rose-700 max-w-md mx-auto">
                {order.paymentDetails?.failureReason ||
                  "The payment transaction was cancelled or declined by your bank."}
              </p>

              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => setIsRetryModalOpen(true)}
                >
                  Retry Payment • {formatPaise(order.totalPaise)}
                </Button>
                <Link href="/checkout">
                  <Button variant="secondary" size="md">
                    Back to Checkout
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Order Reference Box */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#F6F0E7] px-4 py-2.5 border border-[#3B241A]/10 text-xs">
            <span className="text-[#6F4935]">Order Number:</span>
            <span className="font-mono font-bold text-[#3B241A] text-sm">
              {order.orderId}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-[#6F4935] hover:text-[#3B241A] border border-[#3B241A]/10 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-warm-md border border-[#3B241A]/10 space-y-6">
          {/* Estimated Delivery Box */}
          {!isFailed && (
            <div className="rounded-2xl bg-[#F6F0E7]/60 border border-[#3B241A]/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B241A] text-[#F6F0E7]">
                  <Clock className="h-5 w-5 text-[#C58A4A]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6F4935]">
                    Estimated Arrival
                  </p>
                  <p className="text-sm font-bold text-[#3B241A]">
                    {CHECKOUT_CONFIG.estimatedDeliveryMinutesMin}–
                    {CHECKOUT_CONFIG.estimatedDeliveryMinutesMax} Minutes
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
                Fresh Dispatch
              </span>
            </div>
          )}

          {/* Delivery & Customer Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#3B241A]/10">
            <div className="space-y-1 text-xs">
              <p className="font-bold uppercase tracking-wider text-[#6F4935] flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#C58A4A]" />
                <span>Delivery Address</span>
              </p>
              <p className="font-semibold text-sm text-[#3B241A]">{order.customer.name}</p>
              <p className="text-[#6F4935] whitespace-pre-line">{order.customer.address}</p>
              {order.customer.instructions && (
                <p className="text-[11px] italic text-[#6F4935] pt-1">
                  Note: &ldquo;{order.customer.instructions}&rdquo;
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold uppercase tracking-wider text-[#6F4935] flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-[#C58A4A]" />
                <span>Contact & Payment</span>
              </p>
              <p className="text-[#3B241A] font-medium">+91 {order.customer.mobile}</p>
              <p className="text-[#6F4935]">
                Method:{" "}
                <span className="font-bold text-[#3B241A]">
                  {order.paymentMethod === "online" ? "Online Payment (Mock Gateway)" : "Cash on Delivery"}
                </span>
              </p>
              {order.paymentDetails?.transactionId && (
                <p className="text-[11px] text-[#6F4935] font-mono">
                  Txn ID: {order.paymentDetails.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Order List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-3">
              Itemized Drinks ({order.items.length})
            </h3>
            <div className="divide-y divide-[#3B241A]/5">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#3B241A]/10 bg-[#F6F0E7]">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs">
                          ☕
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#3B241A]">
                        {item.productName}{" "}
                        <span className="text-xs font-normal text-[#6F4935]">
                          × {item.quantity}
                        </span>
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-[#6F4935]">
                        <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5 font-medium text-[#3B241A]">
                          {item.customization.size}
                        </span>
                        <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5">
                          {item.customization.milk}
                        </span>
                        <span className="rounded bg-[#F6F0E7] px-1.5 py-0.5">
                          {item.customization.sweetness} Sweet
                        </span>
                        {item.customization.toppings?.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-[#C58A4A]/10 px-1.5 py-0.5 text-[#3B241A]"
                          >
                            +{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#3B241A] shrink-0">
                    {formatPaise(item.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t border-[#3B241A]/10 pt-4 space-y-2 text-xs text-[#6F4935]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-[#3B241A]">
                {formatPaise(order.subtotalPaise)}
              </span>
            </div>

            {order.discountPaise > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Discount ({order.promoCode})</span>
                <span>-{formatPaise(order.discountPaise)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span>Delivery Fee</span>
              <span className="font-medium text-[#3B241A]">
                {order.deliveryFeePaise === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase text-[11px]">
                    Free
                  </span>
                ) : (
                  formatPaise(order.deliveryFeePaise)
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>GST (5%)</span>
              <span className="font-medium text-[#3B241A]">
                {formatPaise(order.taxPaise)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-[#3B241A]/10 pt-3 text-sm">
              <span className="font-bold text-[#3B241A]">
                {isPaid ? "Total Paid" : "Total Payable"}
              </span>
              <span className="font-serif text-2xl font-bold text-[#3B241A]">
                {formatPaise(order.totalPaise)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-[#3B241A]/10 pt-6 flex flex-wrap items-center justify-between gap-3">
            <Link href="/#menu">
              <Button variant="secondary" size="md" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                Order More Coffee
              </Button>
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6F4935] hover:text-[#3B241A] transition-colors py-2 px-3 rounded-xl border border-[#3B241A]/15 hover:bg-[#F6F0E7]/40"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </Container>

      {/* Retry Modal */}
      {order && (
        <MockPaymentModal
          isOpen={isRetryModalOpen}
          orderId={order.orderId}
          totalPaise={order.totalPaise}
          onSuccess={handleRetrySuccess}
          onFailure={handleRetryFailure}
          onCancel={() => setIsRetryModalOpen(false)}
        />
      )}
    </div>
  );
}
