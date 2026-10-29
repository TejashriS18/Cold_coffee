"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Droplets,
  Leaf,
  Award,
  Heart,
  ThermometerSnowflake,
} from "lucide-react";

import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";

const APPROACH_PILLARS = [
  {
    step: "01",
    icon: Leaf,
    title: "Single-Origin Shade-Grown Arabica",
    subtitle: "Western Ghats, 1,200m+ Elevation",
    description:
      "We source exclusively from sustainable family-run estates in Chikmagalur and Coorg. High-altitude shade cultivation allows cherries to ripen slowly, yielding natural notes of toasted hazelnut, honey, and dark cocoa.",
    badge: "100% Direct Trade",
  },
  {
    step: "02",
    icon: ThermometerSnowflake,
    title: "24-Hour Sub-Zero Cold Extraction",
    subtitle: "Cold Steeped at 4°C in Stainless Vats",
    description:
      "Heat damages delicate floral and chocolate volatiles. We replace heat with patience: steeping coarse grinds in triple-filtered mineralized water for 24 continuous hours, eliminating 70% of bitter tannins.",
    badge: "Low Acidity",
  },
  {
    step: "03",
    icon: Droplets,
    title: "Micro-Nitrogen Velvet Infusion",
    subtitle: "Silky Micro-Bubbles Without Heavy Dairy",
    description:
      "Our signature nitro cold brew is charged with pure food-grade nitrogen at high pressure. As it pours through pressurized restrictor taps, it forms a rich cascading foam with a natural sweet, creamy mouthfeel.",
    badge: "Naturally Creamy",
  },
  {
    step: "04",
    icon: Award,
    title: "Farm-Fresh & Plant-Based Milks",
    subtitle: "Zero Artificial Flavorings or Powders",
    description:
      "Every cup uses pure ingredients: farm-fresh whole milk pasteurized within 24 hours of milking, paired with house-steeped creamy oat milk, roasted almond milk, and slow-melted Belgian dark cocoa.",
    badge: "Clean Ingredients",
  },
];

export function AboutUsSection() {
  return (
    <section
      id="about"
      className="scroll-mt-20 py-20 md:py-28 bg-[#FBF8F3] border-t border-[#3B241A]/10 relative overflow-hidden"
    >
      <span id="story" className="scroll-mt-20" />
      <Container size="xl">
        {/* Section Header */}
        <SectionHeading
          eyebrow="Our Story & Craftsmanship"
          title="Made with Passion. Served with Chill."
          description="We believe cold coffee shouldn't just be hot espresso dumped over melting ice cubes. It deserves its own alchemy of time, temperature, and single-origin beans."
          align="center"
          className="mb-16"
        />

        {/* Brand Story & Café Roastery Image Showcase (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          {/* Left Column: Story Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C58A4A]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#C58A4A] border border-[#C58A4A]/25">
              <MapPin className="h-3.5 w-3.5" />
              <span>Founded in 2024 • Bengaluru</span>
            </div>


            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B241A] leading-tight">
              A rebellion against scorched coffee and watered-down ice.
            </h3>

            <p className="text-sm sm:text-base text-[#6F4935] leading-relaxed">
              At <strong className="text-[#3B241A] font-semibold">FROST & BEAN</strong>, we obsess over every single variable: the mineral content of our brewing water, the micrometer precision of our conical burr grinds, and the exact hour each bean was roasted.
            </p>

            <p className="text-sm sm:text-base text-[#6F4935] leading-relaxed">
              When high temperature touches ground coffee, it flashes away aromatic floral oils and extracts caustic quinic acids. By moving from boiling water to 24-hour sub-zero cold steeping, we unlock the hidden sweetness of the coffee cherry—yielding a drink so smooth, it needs remarkably little sugar.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#3B241A]/10">
              <div className="rounded-xl bg-white p-3.5 border border-[#3B241A]/10 shadow-warm-sm text-center">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A]">
                  24h
                </span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#6F4935] mt-0.5">
                  Cold Steep Time
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-[#3B241A]/10 shadow-warm-sm text-center">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C58A4A]">
                  4°C
                </span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#6F4935] mt-0.5">
                  Constant Extraction
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-[#3B241A]/10 shadow-warm-sm text-center">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A]">
                  100%
                </span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#6F4935] mt-0.5">
                  Arabica Beans
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Café & Coffee Roastery Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-warm-lg border border-[#3B241A]/10 bg-white group">
              <Image
                src="/images/cafe-roastery-lab.jpg"
                alt="FROST & BEAN Artisanal Cold Coffee Roastery & Tasting Room"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />

              {/* Floating Luxury Location Badge */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-[#3B241A]/95 backdrop-blur-md rounded-2xl p-4 text-[#F6F0E7] border border-[#C58A4A]/30 shadow-xl flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C58A4A] text-[#271710]">
                  <Heart className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F6F0E7]">
                    Roasting Lab & Cold Brew Vault
                  </p>
                  <p className="text-[11px] text-[#F6F0E7]/80">
                    Handcrafted in Bengaluru • Small Batches Only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coffee-Making Approach & Ingredients Grid (4 Pillars) */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C58A4A]">
              The Four Pillars of Quality
            </span>
            <h4 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B241A] mt-1">
              How We Craft Every Glass
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {APPROACH_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card
                  key={pillar.step}
                  variant="white"
                  className="flex flex-col justify-between p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-warm-md border border-[#3B241A]/10"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6F0E7] text-[#3B241A]">
                        <Icon className="h-5 w-5 text-[#C58A4A]" />
                      </div>
                      <span className="font-serif text-xs font-bold text-[#C58A4A] bg-[#C58A4A]/10 px-2.5 py-0.5 rounded-full border border-[#C58A4A]/20">
                        {pillar.step}
                      </span>
                    </div>

                    <h5 className="font-serif text-base font-bold text-[#3B241A] leading-snug">
                      {pillar.title}
                    </h5>

                    <p className="text-[11px] font-medium text-[#C58A4A] mt-0.5 mb-2.5">
                      {pillar.subtitle}
                    </p>

                    <p className="text-xs text-[#6F4935] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#3B241A]/10 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#6F4935] font-semibold">
                      Standard
                    </span>
                    <Badge variant="caramel" size="sm">
                      {pillar.badge}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
