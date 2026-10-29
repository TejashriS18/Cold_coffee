"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Tag,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { SPECIAL_OFFERS, checkOfferEligibility, SpecialOffer } from "@/config/offers";
import { useCart } from "@/context/CartContext";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";

export function SpecialOffersSection() {
  const { totalCount, subtotalPaise, applyPromoCode, openCart, appliedPromo } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedOfferTerms, setSelectedOfferTerms] = useState<SpecialOffer | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleClaimOffer = (offer: SpecialOffer) => {
    const eligibility = checkOfferEligibility(offer, totalCount, subtotalPaise, new Date());

    if (eligibility.isEligible) {
      const applied = applyPromoCode(offer.promoCode);
      if (applied) {
        openCart();
      }
    } else {
      // If not eligible yet, scroll to menu so customer can add drinks
      const menuEl = document.getElementById("menu");
      if (menuEl) {
        menuEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section
      id="offers"
      className="scroll-mt-20 py-20 md:py-28 bg-[#F6F0E7] border-t border-[#3B241A]/10 relative"
    >
      <Container size="xl">
        {/* Section Header */}
        <SectionHeading
          eyebrow="Limited Drops & Tasting Pairings"
          title="Special Offers & Seasonal Vault"
          description="Exclusive pairings, group rewards, and limited-harvest drops designed for cold coffee enthusiasts. All discounts are verified instantly against your cart."
          align="center"
          className="mb-14"
        />

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SPECIAL_OFFERS.map((offer) => {
            const eligibility = checkOfferEligibility(offer, totalCount, subtotalPaise);
            const isCurrentlyApplied = appliedPromo?.code === offer.promoCode;

            return (
              <div
                key={offer.id}
                className="relative flex flex-col justify-between rounded-3xl bg-white border border-[#3B241A]/10 shadow-warm-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-warm-md group"
              >
                <div>
                  {/* Offer Image Container */}
                  <div className="relative h-52 w-full overflow-hidden bg-[#F6F0E7]">
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Category Tag */}
                    <div className="absolute top-3.5 left-3.5">
                      <Badge variant="caramel" size="sm">
                        {offer.badge}
                      </Badge>
                    </div>

                    {/* Discount Tag */}
                    <div className="absolute top-3.5 right-3.5 rounded-full bg-[#3B241A]/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#F6F0E7] border border-[#C58A4A]/30">
                      {offer.discountSummary}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-[#6F4935] mb-2 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-[#C58A4A]" />
                      <span>Valid through {offer.formattedEndDate}</span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#3B241A] leading-snug">
                      {offer.title}
                    </h3>

                    <p className="mt-2 text-xs text-[#6F4935] leading-relaxed">
                      {offer.description}
                    </p>

                    {/* Eligibility Status Banner */}
                    <div
                      className={`mt-4 rounded-xl p-2.5 text-xs flex items-start gap-2 border ${
                        isCurrentlyApplied
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : eligibility.isEligible
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isCurrentlyApplied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Active in your cart!</span>
                            <p className="text-[11px] text-emerald-700">
                              Discount applied at checkout.
                            </p>
                          </div>
                        </>
                      ) : eligibility.isEligible ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">You qualify for this offer!</span>
                            <p className="text-[11px] text-emerald-700">
                              Click claim to apply immediately.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Eligibility check:</span>
                            <p className="text-[11px] text-amber-700">
                              {eligibility.statusMessage}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Promo Code & Action */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F0E7]/60 p-2 border border-[#3B241A]/10">
                    <div className="flex items-center gap-1.5 pl-2">
                      <Tag className="h-3.5 w-3.5 text-[#C58A4A]" />
                      <span className="font-mono text-xs font-bold text-[#3B241A]">
                        {offer.promoCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.promoCode)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-[#6F4935] hover:text-[#3B241A] border border-[#3B241A]/10 shadow-sm transition-colors"
                    >
                      {copiedCode === offer.promoCode ? (
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isCurrentlyApplied ? "secondary" : "primary"}
                      size="md"
                      className="flex-1 justify-center text-xs"
                      onClick={() => handleClaimOffer(offer)}
                    >
                      {isCurrentlyApplied
                        ? "Applied in Cart ✓"
                        : eligibility.isEligible
                        ? "Claim Offer Now"
                        : "Explore Eligible Drinks"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setSelectedOfferTerms(offer)}
                      className="p-2.5 rounded-xl border border-[#3B241A]/15 text-[#6F4935] hover:text-[#3B241A] hover:bg-[#F6F0E7]/60 transition-colors"
                      title="View Offer Terms & Conditions"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      {/* Terms & Conditions Modal */}
      {selectedOfferTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#271710]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOfferTerms(null)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#3B241A]/10 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#3B241A]/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C58A4A]">
                  Offer Terms & Conditions
                </span>
                <h4 className="font-serif text-lg font-bold text-[#3B241A] mt-0.5">
                  {selectedOfferTerms.title}
                </h4>
              </div>
            </div>

            <div className="my-4 space-y-2">
              <p className="text-xs text-[#6F4935] font-semibold uppercase tracking-wider">
                Configured Rules:
              </p>
              <ul className="space-y-1.5 text-xs text-[#6F4935]">
                {selectedOfferTerms.terms.map((term, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#C58A4A] mt-0.5">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#3B241A]/10 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedOfferTerms(null)}
              >
                Close Terms
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
