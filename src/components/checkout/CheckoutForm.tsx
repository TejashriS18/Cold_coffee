"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { CustomerDetails, PaymentMethod } from "@/types";
import { CHECKOUT_CONFIG } from "@/config/checkout";
import { formatPaise } from "@/config/site";

interface CheckoutFormProps {
  customer: CustomerDetails;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  totalPaise: number;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function CheckoutForm({
  customer,
  setCustomer,
  paymentMethod,
  setPaymentMethod,
  totalPaise,
  errors,
  setErrors,
}: CheckoutFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: keyof CustomerDetails, value: string) => {
    let err = "";
    if (field === "name") {
      if (!value.trim()) {
        err = "Full name is required.";
      } else if (value.trim().length < 2) {
        err = "Name must be at least 2 characters.";
      }
    } else if (field === "mobile") {
      const clean = value.replace(/\D/g, "");
      if (!clean) {
        err = "Mobile number is required.";
      } else if (!/^[6-9]\d{9}$/.test(clean)) {
        err = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
      }
    } else if (field === "address") {
      if (!value.trim()) {
        err = "Delivery address is required.";
      } else if (value.trim().length < 10) {
        err = "Please include building/flat, street, and area (minimum 10 characters).";
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleBlur = (field: keyof CustomerDetails) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, customer[field] || "");
  };

  const handleChange = (field: keyof CustomerDetails, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const isCodAvailable =
    CHECKOUT_CONFIG.isCodEnabled &&
    totalPaise <= CHECKOUT_CONFIG.maxCodOrderPaise;

  return (
    <div className="space-y-6">
      {/* 1. Customer & Delivery Information */}
      <div className="rounded-2xl bg-white p-6 shadow-warm-sm border border-[#3B241A]/10">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#3B241A]/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B241A]/5 text-[#3B241A]">
            <MapPin className="h-4 w-4 text-[#C58A4A]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#3B241A]">
              1. Delivery Details
            </h2>
            <p className="text-xs text-[#6F4935]">
              Where should we deliver your chilled brew?
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="customer-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1.5"
            >
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6F4935]/60">
                <User className="h-4 w-4" />
              </div>
              <input
                id="customer-name"
                type="text"
                value={customer.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="e.g. Aanya Sharma"
                className={`w-full rounded-xl border bg-[#F6F0E7]/20 py-2.5 pl-10 pr-4 text-sm text-[#3B241A] placeholder:text-[#6F4935]/40 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-[#3B241A]/15 focus:border-[#3B241A] focus:ring-[#3B241A]/10"
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="customer-mobile"
              className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1.5"
            >
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6F4935]/60">
                <Phone className="h-4 w-4" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-9 flex items-center text-xs font-bold text-[#3B241A]">
                +91
              </div>
              <input
                id="customer-mobile"
                type="tel"
                maxLength={10}
                value={customer.mobile}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  handleChange("mobile", cleaned);
                }}
                onBlur={() => handleBlur("mobile")}
                placeholder="9876543210"
                className={`w-full rounded-xl border bg-[#F6F0E7]/20 py-2.5 pl-18 pr-4 text-sm text-[#3B241A] placeholder:text-[#6F4935]/40 focus:outline-none focus:ring-2 transition-all ${
                  errors.mobile
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-[#3B241A]/15 focus:border-[#3B241A] focus:ring-[#3B241A]/10"
                }`}
              />
            </div>
            {errors.mobile ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.mobile}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-[#6F4935]/70">
                We will send live cold-chain dispatch and order updates via SMS.
              </p>
            )}
          </div>

          {/* Delivery Address */}
          <div>
            <label
              htmlFor="customer-address"
              className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1.5"
            >
              Delivery Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute top-3 left-3 text-[#6F4935]/60">
                <MapPin className="h-4 w-4" />
              </div>
              <textarea
                id="customer-address"
                rows={3}
                value={customer.address}
                onChange={(e) => handleChange("address", e.target.value)}
                onBlur={() => handleBlur("address")}
                placeholder="Flat / House No., Apartment / Wing, Street Name, Landmark, City & PIN code"
                className={`w-full rounded-xl border bg-[#F6F0E7]/20 py-2.5 pl-10 pr-4 text-sm text-[#3B241A] placeholder:text-[#6F4935]/40 focus:outline-none focus:ring-2 transition-all resize-none ${
                  errors.address
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-[#3B241A]/15 focus:border-[#3B241A] focus:ring-[#3B241A]/10"
                }`}
              />
            </div>
            {errors.address && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>

          {/* Delivery Instructions (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="customer-instructions"
                className="text-xs font-bold uppercase tracking-wider text-[#6F4935]"
              >
                Delivery Instructions (Optional)
              </label>
              <span className="text-[11px] text-[#6F4935]/60">
                {(customer.instructions || "").length}/150
              </span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute top-3 left-3 text-[#6F4935]/60">
                <FileText className="h-4 w-4" />
              </div>
              <textarea
                id="customer-instructions"
                rows={2}
                maxLength={150}
                value={customer.instructions || ""}
                onChange={(e) => handleChange("instructions", e.target.value)}
                placeholder="e.g. Ring doorbell twice, keep cold bag in shade, do not shake cups."
                className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2.5 pl-10 pr-4 text-sm text-[#3B241A] placeholder:text-[#6F4935]/40 focus:outline-none focus:ring-2 focus:border-[#3B241A] focus:ring-[#3B241A]/10 resize-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Payment Method Selection */}
      <div className="rounded-2xl bg-white p-6 shadow-warm-sm border border-[#3B241A]/10">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#3B241A]/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B241A]/5 text-[#3B241A]">
            <CreditCard className="h-4 w-4 text-[#C58A4A]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#3B241A]">
              2. Payment Method
            </h2>
            <p className="text-xs text-[#6F4935]">
              Choose how you wish to complete your purchase
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {/* Option A: Online Payment */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === "online"
                ? "border-[#3B241A] bg-[#3B241A]/5 ring-1 ring-[#3B241A]"
                : "border-[#3B241A]/15 hover:border-[#3B241A]/30 bg-white"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
              className="mt-1 h-4 w-4 text-[#3B241A] border-[#3B241A]/30 focus:ring-[#C58A4A]"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#3B241A] flex items-center gap-1.5">
                  <span>Online Payment (UPI, Cards, NetBanking)</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Recommended
                  </span>
                </span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-1 text-xs text-[#6F4935]">
                Fast, contactless checkout with Google Pay, PhonePe, Paytm, or credit/debit cards.
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#C58A4A] font-medium">
                <ShieldCheck className="h-3 w-3" />
                <span>Simulated sandbox gateway enabled for safe testing.</span>
              </div>

            </div>
          </label>

          {/* Option B: Cash on Delivery */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
              !isCodAvailable
                ? "opacity-50 cursor-not-allowed border-dashed border-[#3B241A]/20 bg-[#F6F0E7]/30"
                : paymentMethod === "cod"
                ? "border-[#3B241A] bg-[#3B241A]/5 ring-1 ring-[#3B241A] cursor-pointer"
                : "border-[#3B241A]/15 hover:border-[#3B241A]/30 bg-white cursor-pointer"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              disabled={!isCodAvailable}
              checked={paymentMethod === "cod"}
              onChange={() => {
                if (isCodAvailable) setPaymentMethod("cod");
              }}
              className="mt-1 h-4 w-4 text-[#3B241A] border-[#3B241A]/30 focus:ring-[#C58A4A] disabled:opacity-40"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#3B241A] flex items-center gap-1.5">
                  <span>Cash on Delivery (COD)</span>
                </span>
                <Banknote className="h-4 w-4 text-[#6F4935]" />
              </div>
              <p className="mt-1 text-xs text-[#6F4935]">
                Pay with exact cash or scan courier QR when your cold brew arrives.
              </p>
              {!CHECKOUT_CONFIG.isCodEnabled ? (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600">
                  Cash on delivery is currently disabled for this store.
                </p>
              ) : totalPaise > CHECKOUT_CONFIG.maxCodOrderPaise ? (
                <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                  COD is only available for orders up to {formatPaise(CHECKOUT_CONFIG.maxCodOrderPaise)}.
                </p>
              ) : null}
            </div>
          </label>

          {errors.paymentMethod && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.paymentMethod}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
