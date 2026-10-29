import React from "react";
import Image from "next/image";
import { CoffeeProduct } from "@/types";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Plus, Eye } from "lucide-react";
import { formatPrice } from "@/config/site";

export interface ProductCardProps {
  product: CoffeeProduct;
  onAddToCart?: (product: CoffeeProduct) => void;
  onQuickView?: (product: CoffeeProduct) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-[#3B241A]/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#3B241A]/20">
      {/* Top Meta Badges */}
      <div className="flex items-center justify-between gap-2 mb-3 z-10">
        <Badge variant="coffee" size="sm">
          {product.category}
        </Badge>
        {product.isBestSeller && (
          <Badge variant="caramel" size="sm" className="font-semibold">
            ★ Bestseller
          </Badge>
        )}
        {product.isLimitedRelease && (
          <Badge variant="chocolate" size="sm">
            Special
          </Badge>
        )}
      </div>

      {/* Visual Product Display Container */}
      <div
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-[#F6F0E7]/70 border border-[#3B241A]/5 cursor-pointer group-hover:bg-[#F6F0E7]"
        onClick={() => onQuickView && onQuickView(product)}
        title={`Quick view ${product.name}`}
      >
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Subtle Gradient Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

            {/* Quick View Hover Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#3B241A] shadow-md hover:bg-white transition-colors">
                <Eye className="h-3.5 w-3.5" />
                Quick View
              </span>
            </div>

            {/* Origin Stamp */}
            <span className="absolute top-2.5 left-2.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] font-semibold text-white border border-white/15">
              {product.origin}
            </span>

            {/* Brew Method Pill */}
            <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-medium text-white border border-white/15">
              {product.brewMethod}
            </span>
          </>
        ) : (
          <>
            <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#6F4935]">
              {product.origin}
            </span>
            <div className="relative flex flex-col items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]">
              <div className="h-3 w-6 rounded-t-sm bg-[#3B241A]" />
              <div className="h-2 w-4 bg-[#6F4935]" />
              <div className="relative flex h-28 w-20 flex-col items-center justify-between rounded-2xl border border-[#3B241A]/15 bg-[#3B241A] p-2 shadow-sm">
                <div className="my-auto flex flex-col items-center rounded-sm bg-[#F6F0E7] px-2 py-1.5 text-center shadow-xs w-full max-w-[62px]">
                  <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#3B241A]">
                    F&B
                  </span>
                  <span className="text-[7px] text-[#6F4935] uppercase tracking-tight font-medium">
                    {product.roastLevel}
                  </span>
                </div>
                <div className="h-1 w-10 rounded-full bg-[#C58A4A]" />
              </div>
            </div>
            <span className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wider font-medium text-[#6F4935]">
              {product.roastLevel} Roast
            </span>
          </>
        )}
      </div>

      {/* Product Information */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          <h3
            className="font-serif text-xl font-semibold tracking-tight text-[#3B241A] group-hover:text-[#6F4935] transition-colors cursor-pointer"
            onClick={() => onQuickView && onQuickView(product)}
          >
            {product.name}
          </h3>

          <p className="mt-1.5 text-xs text-[#6F4935] line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Tasting Notes */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.notes.map((note) => (
              <span
                key={note}
                className="rounded-md bg-[#F6F0E7] px-2.5 py-0.5 text-[11px] font-medium text-[#5C3B29] border border-[#3B241A]/5"
              >
                {note}
              </span>
            ))}
          </div>

          {/* Intensity Indicator */}
          <div className="mt-3.5 flex items-center gap-2 border-t border-[#3B241A]/5 pt-3">
            <span className="text-[11px] uppercase tracking-wider text-[#6F4935] font-medium">
              Intensity:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 w-3.5 rounded-full transition-colors ${
                    level <= product.intensity
                      ? "bg-[#C58A4A]"
                      : "bg-[#EAE0D0]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-5 flex items-center justify-between border-t border-[#3B241A]/10 pt-3.5">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#6F4935] font-medium block">
              16 oz Iced Glass
            </span>
            <span className="font-serif text-xl font-bold tracking-tight text-[#3B241A]">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickView && onQuickView(product)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3B241A]/15 bg-[#F6F0E7] text-[#3B241A] hover:bg-white hover:border-[#3B241A]/30 transition-colors"
              aria-label={`Quick view ${product.name}`}
              title="Quick View"
            >
              <Eye className="h-4 w-4" />
            </button>

            <Button
              size="sm"
              variant="primary"
              className="gap-1.5 px-4 shadow-xs"
              onClick={() => onAddToCart && onAddToCart(product)}
              aria-label={`Add ${product.name} to order`}
            >
              <span>Add</span>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
