"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatPaise } from "@/config/site";
import { Button } from "@/components/common/Button";

interface MockPaymentModalProps {
  isOpen: boolean;
  orderId: string;
  totalPaise: number;
  onSuccess: () => Promise<void>;
  onFailure: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function MockPaymentModal({
  isOpen,
  orderId,
  totalPaise,
  onSuccess,
  onFailure,
  onCancel,
}: MockPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"card" | "upi" | "netbanking">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateSuccess = async () => {
    setIsProcessing(true);
    setProcessingState("Contacting issuing bank & verifying OTP...");
    try {
      await new Promise((res) => setTimeout(res, 800));
      setProcessingState("Verifying cryptographic signature on merchant server...");
      await onSuccess();
    } finally {
      setIsProcessing(false);
      setProcessingState(null);
    }
  };

  const handleSimulateFailure = async () => {
    setIsProcessing(true);
    setProcessingState("Processing transaction...");
    try {
      await new Promise((res) => setTimeout(res, 700));
      await onFailure("Transaction declined by bank: Insufficient funds or invalid PIN (Mock Simulation).");
    } finally {
      setIsProcessing(false);
      setProcessingState(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#271710]/70 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isProcessing) onCancel();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#3B241A]/10 text-[#3B241A] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Test Mode Banner */}
        <div className="bg-[#C58A4A] text-[#271710] px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>TEST MODE • MOCK PAYMENT GATEWAY</span>
          </div>
          <span className="font-mono text-[11px] opacity-90">PCI-DSS Sim</span>
        </div>

        {/* Header */}
        <div className="p-5 border-b border-[#3B241A]/10 flex items-start justify-between bg-[#F6F0E7]/40">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B241A] text-[#F6F0E7]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#3B241A]">
                  FROST & BEAN Pay
                </h3>
                <p className="text-xs text-[#6F4935]">
                  Order Ref: <span className="font-mono font-medium">{orderId}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6F4935] uppercase tracking-wide">Payable Amount</p>
            <p className="font-serif text-xl font-bold text-[#3B241A]">
              {formatPaise(totalPaise)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-[#F6F0E7] p-3 border border-[#3B241A]/10 text-xs text-[#6F4935] flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-[#C58A4A] shrink-0 mt-0.5" />
            <p>
              This is a sandbox simulation environment. No real funds will be deducted. Select a payment method and click one of the simulation triggers below.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-2">
              Select Test Instrument
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod("upi")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  selectedMethod === "upi"
                    ? "border-[#3B241A] bg-[#3B241A]/5 text-[#3B241A] ring-1 ring-[#3B241A]"
                    : "border-[#3B241A]/15 text-[#6F4935] hover:border-[#3B241A]/30"
                }`}
              >
                <Smartphone className="h-5 w-5 mb-1.5 text-[#C58A4A]" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("card")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  selectedMethod === "card"
                    ? "border-[#3B241A] bg-[#3B241A]/5 text-[#3B241A] ring-1 ring-[#3B241A]"
                    : "border-[#3B241A]/15 text-[#6F4935] hover:border-[#3B241A]/30"
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1.5 text-[#C58A4A]" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("netbanking")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  selectedMethod === "netbanking"
                    ? "border-[#3B241A] bg-[#3B241A]/5 text-[#3B241A] ring-1 ring-[#3B241A]"
                    : "border-[#3B241A]/15 text-[#6F4935] hover:border-[#3B241A]/30"
                }`}
              >
                <Building2 className="h-5 w-5 mb-1.5 text-[#C58A4A]" />
                <span>NetBanking</span>
              </button>
            </div>
          </div>

          {/* Instrument Details Mock Preview */}
          <div className="rounded-xl border border-[#3B241A]/10 bg-[#FAF7F2] p-3 text-xs space-y-2">
            {selectedMethod === "upi" && (
              <div className="flex items-center justify-between text-[#6F4935]">
                <span>Test VPA:</span>
                <span className="font-mono font-medium text-[#3B241A]">frostbean@testupi</span>
              </div>
            )}
            {selectedMethod === "card" && (
              <div className="flex items-center justify-between text-[#6F4935]">
                <span>Test Card:</span>
                <span className="font-mono font-medium text-[#3B241A]">•••• •••• •••• 4242 (Mock Visa)</span>
              </div>
            )}
            {selectedMethod === "netbanking" && (
              <div className="flex items-center justify-between text-[#6F4935]">
                <span>Test Bank:</span>
                <span className="font-medium text-[#3B241A]">HDFC Bank (Sandbox)</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[#6F4935] border-t border-[#3B241A]/5 pt-1.5">
              <span>Security Check:</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> 256-bit Encrypted
              </span>
            </div>
          </div>

          {/* Status feedback during processing */}
          {isProcessing && (
            <div className="rounded-xl bg-[#C58A4A]/10 border border-[#C58A4A]/30 p-3 flex items-center gap-3 text-xs text-[#3B241A]">
              <Loader2 className="h-4 w-4 animate-spin text-[#C58A4A] shrink-0" />
              <span>{processingState || "Processing payment..."}</span>
            </div>
          )}
        </div>

        {/* Footer with Simulation Actions */}
        <div className="p-5 border-t border-[#3B241A]/10 bg-[#F6F0E7]/40 space-y-2.5">
          <p className="text-[11px] text-center text-[#6F4935] font-medium">
            Trigger a test simulation scenario:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Simulate Success */}
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isProcessing}
              className="w-full justify-center bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleSimulateSuccess}
            >
              Simulate Success
            </Button>

            {/* Simulate Failure */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isProcessing}
              className="w-full justify-center border-rose-300 text-rose-700 hover:bg-rose-50"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={handleSimulateFailure}
            >
              Simulate Failure
            </Button>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="w-full py-2 text-center text-xs font-medium text-[#6F4935] hover:text-[#3B241A] transition-colors disabled:opacity-50"
          >
            Cancel & Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
