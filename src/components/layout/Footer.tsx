"use client";

import React from "react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { ShieldCheck, Award, ArrowRight } from "lucide-react";


export function Footer() {
  return (
    <footer id="contact" className="w-full bg-[#3B241A] text-[#F6F0E7] border-t border-[#3B241A] scroll-mt-20">
      <Container size="lg" className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#271710] border border-[#C58A4A]/30 text-[#F6F0E7]">
                <span className="font-serif text-base font-bold">F</span>
              </div>
              <span className="font-serif text-lg font-bold tracking-wider uppercase text-[#F6F0E7]">
                Frost <span className="text-[#C58A4A]">&</span> Bean
              </span>
            </div>

            <p className="max-w-sm text-sm text-[#F6F0E7]/80 leading-relaxed font-light">
              Crafting premium cold coffees through precision 24-hour slow steeping and sub-zero filtration.
              Intensely smooth, naturally balanced, and uncompromised by heat.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-[#C58A4A]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> 100% Specialty Arabica
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Micro-Batch Roasted
              </span>

            </div>
          </div>

          {/* Column 1: Cold Coffee Lineup */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C58A4A]">
              Cold Brews
            </h4>
            <ul className="space-y-2.5 text-sm text-[#F6F0E7]/75">
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Glacier Reserve
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Nitro Velvet Stout
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Bourbon Vanilla Distillate
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Single Origin Micro-Lots
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: The Roastery */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C58A4A]">
              The Craft
            </h4>
            <ul className="space-y-2.5 text-sm text-[#F6F0E7]/75">
              <li>
                <a href="#process" className="hover:text-white transition-colors">
                  24-Hour Cold Extraction
                </a>
              </li>
              <li>
                <a href="#process" className="hover:text-white transition-colors">
                  Nitro Micro-Infusion
                </a>
              </li>
              <li>
                <a href="#story" className="hover:text-white transition-colors">
                  Direct Trade Partner Farms
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Sustainability Standards
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C58A4A]">
              Reserve Drops
            </h4>
            <p className="text-xs text-[#F6F0E7]/75 leading-relaxed">
              Receive early access to seasonal single-origin micro-lots before they sell out.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2.5 pt-1">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full border border-[#6F4935] bg-[#271710] px-4 py-2 text-xs text-[#F6F0E7] placeholder-[#F6F0E7]/40 focus:border-[#C58A4A] focus:outline-none transition-colors"
              />
              <Button
                size="sm"
                variant="caramel"
                className="w-full justify-center text-xs"
                rightIcon={<ArrowRight className="h-3 w-3" />}
              >
                Join Reserve Club
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#6F4935]/40 pt-8 text-xs text-[#F6F0E7]/60 sm:flex-row">
          <p>© 2026 FROST & BEAN COLD COFFEE CO. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#F6F0E7] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#F6F0E7] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#F6F0E7] transition-colors">
              Extraction Ethics
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
