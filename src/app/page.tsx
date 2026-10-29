"use client";

import React, { Suspense } from "react";
import { Hero } from "@/components/home/Hero";
import { MenuSection } from "@/components/menu/MenuSection";
import { AboutUsSection } from "@/components/home/AboutUsSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { CustomerReviewsSection } from "@/components/home/CustomerReviewsSection";
import { Container } from "@/components/common/Container";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { MapPin, Phone, Mail, Clock, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F6F0E7]">
      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. OUR MENU SECTION (WITH SEARCH, CATEGORY FILTERS, & QUICK VIEW MODAL) */}
      <MenuSection />

      {/* 3. ABOUT US SECTION (HEADING: "Made with Passion. Served with Chill.") */}
      <AboutUsSection />

      {/* 4. SPECIAL OFFERS SECTION (COFFEE & BROWNIE, B2G1, SEASONAL OFFERS) */}
      <Suspense fallback={<div className="py-20 text-center text-xs text-[#6F4935]">Loading special drops...</div>}>
        <SpecialOffersSection />
      </Suspense>

      {/* 5. CUSTOMER REVIEWS SECTION (COMMUNITY REVIEWS & TRANSPARENT DEMO NOTICE) */}
      <CustomerReviewsSection />

      {/* 6. CAFÉ LAB VISIT & CONTACT SECTION (ANCHOR: #contact) */}
      <section
        id="contact"
        className="scroll-mt-20 py-20 bg-[#3B241A] text-[#F6F0E7] border-t border-[#3B241A]/20"
      >
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Brand Invitation */}
            <div className="lg:col-span-7 space-y-5">
              <Badge variant="caramel" size="sm">
                Tasting Room & Lab
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F6F0E7]">
                Experience Cold Extraction in Person.
              </h2>
              <p className="text-sm sm:text-base text-[#F6F0E7]/80 leading-relaxed font-light max-w-xl">
                Visit our artisanal flagship tasting room in Bengaluru. Watch live nitro infusions, sample single-origin flights from the Western Ghats, and pick up fresh cold bottles chilled on demand.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Button
                  variant="caramel"
                  size="md"
                  onClick={() => {
                    const el = document.getElementById("menu");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Order for Express Delivery
                </Button>
              </div>
            </div>

            {/* Right Column: Contact & Hours Card */}
            <div className="lg:col-span-5 rounded-3xl bg-[#271710]/80 border border-[#C58A4A]/25 p-6 sm:p-8 space-y-4 backdrop-blur-md">
              <h3 className="font-serif text-xl font-bold text-[#F6F0E7] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C58A4A]" />
                <span>Flagship Roastery & Roasteria</span>
              </h3>

              <div className="space-y-3 text-xs text-[#F6F0E7]/80">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#C58A4A] shrink-0 mt-0.5" />
                  <span>
                    42, 100 Feet Road, 12th Main, Indiranagar, Bengaluru, Karnataka 560038
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#C58A4A] shrink-0" />
                  <span>Open Daily: 7:00 AM – 11:00 PM</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#C58A4A] shrink-0" />
                  <span>+91 98765 43210 / 080 4123 4567</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#C58A4A] shrink-0" />
                  <span>concierge@frostandbean.coffee</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#C58A4A]/20 flex items-center justify-between text-[11px] text-[#F6F0E7]/60">
                <span>Direct Western Ghats Agroforestry</span>
                <span>FSSAI Lic. 11224333000123</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
