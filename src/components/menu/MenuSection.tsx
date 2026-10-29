"use client";

import React, { useState, useMemo } from "react";
import {
  CoffeeProduct,
  MenuFilterCategory,
  DrinkCustomizationSelection,
} from "@/types";
import { PRODUCTS, MENU_CATEGORIES } from "@/data/products";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductQuickViewModal } from "@/components/menu/ProductQuickViewModal";
import { Button } from "@/components/common/Button";
import { useCart } from "@/context/CartContext";
import { Search, X, Coffee, CheckCircle2 } from "lucide-react";


export function MenuSection() {
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState<MenuFilterCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CoffeeProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: PRODUCTS.length };
    PRODUCTS.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.notes.some((note) => note.toLowerCase().includes(q)) ||
        product.origin.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleQuickAdd = (product: CoffeeProduct) => {
    addToCart(product);
    setToastMessage(`Added "${product.name}" to order (Regular size).`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleQuickViewAdd = (
    product: CoffeeProduct,
    customization: DrinkCustomizationSelection,
    quantity: number
  ) => {
    addToCart(product, customization, quantity);
    setToastMessage(
      `Added ${quantity > 1 ? `${quantity}x ` : ""}"${product.name}" (${customization.size}, ${customization.milk}) to order.`
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenQuickView = (product: CoffeeProduct) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
  };

  return (
    <section
      id="menu"
      className="scroll-mt-20 py-16 md:py-24 border-t border-[#3B241A]/10 bg-[#F6F0E7]"
    >
      <span id="collection" className="scroll-mt-20" />
      <Container size="lg">
        {/* Section Heading */}
        <SectionHeading
          eyebrow="The Cold Vault • Fresh Extraction"
          title="Our Signature Cold Menu"
          description="Crafted with sub-zero micro-filtration, artisan caramel ribbons, rich chocolate ganache, and chilled fresh cream."
          align="center"
          className="mb-10"
        />

        {/* Filter & Search Bar Controls */}
        <div className="mx-auto max-w-4xl mb-12 space-y-6">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-4.5 h-4.5 w-4.5 text-[#6F4935]/70 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cold coffee by name, flavor note, or category..."
              className="w-full rounded-full border border-[#3B241A]/15 bg-white py-3.5 pl-12 pr-11 text-sm text-[#3B241A] placeholder-[#6F4935]/50 shadow-xs focus:border-[#C58A4A] focus:outline-none focus:ring-2 focus:ring-[#C58A4A]/20 transition-all"
              aria-label="Search cold coffees"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 rounded-full p-1 text-[#6F4935] hover:text-[#3B241A] hover:bg-[#F6F0E7] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="Filter menu by category"
          >
            {MENU_CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              const count = categoryCounts[category] || 0;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A] ${
                    isActive
                      ? "bg-[#3B241A] text-[#F6F0E7] shadow-sm"
                      : "bg-white text-[#6F4935] border border-[#3B241A]/15 hover:border-[#3B241A]/30 hover:bg-[#FBF8F3]"
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#F6F0E7] text-[#6F4935]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Results Indicator */}
          <div className="flex items-center justify-between text-xs text-[#6F4935] pt-1 px-2">
            <span>
              Showing{" "}
              <strong className="text-[#3B241A]">{filteredProducts.length}</strong> of{" "}
              {PRODUCTS.length} cold coffees
            </span>
            {(searchQuery || activeCategory !== "All") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-medium text-[#C58A4A] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Responsive Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleQuickAdd}
                onQuickView={handleOpenQuickView}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="mx-auto max-w-md rounded-3xl border border-[#3B241A]/10 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6F0E7] text-[#C58A4A]">
              <Coffee className="h-8 w-8 text-[#6F4935]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#3B241A]">
              No Cold Coffees Found
            </h3>
            <p className="mt-2 text-xs text-[#6F4935] leading-relaxed">
              We couldn&apos;t find any cold drinks matching{" "}
              {searchQuery && (
                <span className="font-semibold text-[#3B241A]">&ldquo;{searchQuery}&rdquo;</span>
              )}{" "}
              {activeCategory !== "All" && `in "${activeCategory}"`}.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-6"
              onClick={handleResetFilters}
            >
              Reset Filters & View All
            </Button>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#3B241A]/15 bg-white px-4 py-3 shadow-warm-md text-[#3B241A]">
              <CheckCircle2 className="h-4 w-4 text-[#C58A4A] shrink-0" />
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>

          </div>
        )}

        {/* Quick View Customization Modal */}
        <ProductQuickViewModal
          key={selectedProduct?.id || "modal"}
          product={selectedProduct}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          onAddToCart={handleQuickViewAdd}
        />
      </Container>
    </section>
  );
}
