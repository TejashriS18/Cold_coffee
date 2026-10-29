"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Compass, Snowflake, Clock, ShieldCheck } from "lucide-react";

import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

export function Hero() {
  const handleScrollToMenu = () => {
    const element = document.getElementById("collection");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToStory = () => {
    const element = document.getElementById("story");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#F6F0E7] py-12 sm:py-16 md:py-20 lg:py-24">
      {/* Subtle Warm Ambient Glows (Non-intrusive) */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C58A4A]/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 -translate-y-1/2 rounded-full bg-[#6F4935]/5 blur-3xl"
        aria-hidden="true"
      />

      <Container size="lg" className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* LEFT COLUMN: Brand Story & Call to Action */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Brand Eyebrow Badge */}
            <div className="mb-5 inline-flex items-center gap-2">
              <Badge variant="caramel" size="md" className="gap-2 px-3.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C58A4A]" />
                <span className="font-semibold uppercase tracking-widest text-[#8F5A23]">
                  FROST & BEAN
                </span>
                <span className="text-[#8F5A23]/60">•</span>
                <span className="text-[#8F5A23]">Cold Brew Roastery</span>
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-bold tracking-tight text-[#3B241A] leading-[1.12]">
              Chill Your World. <br />
              <span className="italic font-normal text-[#C58A4A]">
                Sip the Happiness.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-xl text-lg sm:text-xl text-[#6F4935] leading-relaxed font-normal">
              Smooth coffee. Creamy textures. Unforgettable flavours.
            </p>

            {/* Micro Feature Highlights */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-[#3B241A]/10 px-3 py-1 text-xs font-medium text-[#3B241A] shadow-xs">
                <Snowflake className="h-3.5 w-3.5 text-[#C58A4A]" />
                Sub-Zero Extraction
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-[#3B241A]/10 px-3 py-1 text-xs font-medium text-[#3B241A] shadow-xs">
                <Clock className="h-3.5 w-3.5 text-[#6F4935]" />
                24-Hour Cold Steep
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-[#3B241A]/10 px-3 py-1 text-xs font-medium text-[#3B241A] shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C58A4A]" />
                Zero Harsh Bitterness
              </span>

            </div>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex w-full flex-col sm:w-auto sm:flex-row items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-sm hover:shadow-md"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={handleScrollToMenu}
              >
                Explore Menu
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                leftIcon={<Compass className="h-4 w-4 text-[#6F4935]" />}
                onClick={handleScrollToStory}
              >
                Our Story
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Cold Coffee Product Showcase */}
          <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
            {/* Subtle Decorative Background Frame */}
            <div className="relative mx-auto overflow-hidden rounded-3xl border border-[#3B241A]/10 bg-white p-3 shadow-warm-lg transition-transform duration-300 hover:shadow-warm-xl sm:p-4">
              {/* Product Image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#F6F0E7]">
                <Image
                  src="/images/hero-cold-coffee.jpg"
                  alt="FROST & BEAN signature cold brew coffee with silky foam and ice cubes"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="object-cover object-center transition-transform duration-500 hover:scale-[1.02]"
                />

                {/* Subtle Radial Vignette for Depth */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#3B241A]/10" />
              </div>

              {/* Floating Badge 1: Temperature & Extraction */}
              <div className="absolute top-6 left-6 rounded-xl border border-white/60 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <Snowflake className="h-3.5 w-3.5 text-[#C58A4A]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3B241A]">
                    Cold Extracted • 2.4°C
                  </span>
                </div>
              </div>

              {/* Floating Badge 2: Velvety Foam Feature */}
              <div className="absolute bottom-6 right-6 rounded-xl border border-white/60 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#C58A4A]">
                  Signature Layer
                </span>
                <span className="font-serif text-xs font-semibold text-[#3B241A]">
                  Velvety Cold Foam
                </span>
              </div>
            </div>

            {/* Subtle Decorative Accent Elements */}
            <div
              className="pointer-events-none absolute -bottom-4 -left-4 hidden h-12 w-12 items-center justify-center rounded-full border border-[#3B241A]/15 bg-[#F6F0E7] shadow-sm sm:flex"
              aria-hidden="true"
            >
              <div className="h-3 w-3 rounded-full bg-[#C58A4A]" />
            </div>

            <div
              className="pointer-events-none absolute -top-3 -right-3 hidden h-9 w-9 items-center justify-center rounded-full border border-[#3B241A]/10 bg-white shadow-xs sm:flex"
              aria-hidden="true"
            >
              <Snowflake className="h-4 w-4 text-[#C58A4A]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
