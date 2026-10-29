"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  CheckCircle2,
  AlertCircle,
  Coffee,
} from "lucide-react";
import {
  CoffeeProduct,
  CupSize,
  MilkOption,
  SweetnessLevel,
  DrinkTopping,
  DrinkCustomizationSelection,
} from "@/types";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatPrice } from "@/config/site";
import {
  DEFAULT_CUSTOMIZATION_CONFIG,
  calculateCustomizationPrice,
} from "@/data/customization";

export interface ProductQuickViewModalProps {
  product: CoffeeProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: CoffeeProduct,
    customization: DrinkCustomizationSelection,
    quantity: number
  ) => void;
  isEditing?: boolean;
  editingCartItemId?: string;
  initialCustomization?: DrinkCustomizationSelection;
  initialQuantity?: number;
  onUpdateCartItem?: (
    cartItemId: string,
    newCustomization: DrinkCustomizationSelection,
    quantity: number
  ) => void;
}

export function ProductQuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isEditing = false,
  editingCartItemId,
  initialCustomization,
  initialQuantity = 1,
  onUpdateCartItem,
}: ProductQuickViewModalProps) {
  const config = product?.customizationConfig || DEFAULT_CUSTOMIZATION_CONFIG;

  // Selected Options
  const [selectedSize, setSelectedSize] = useState<CupSize>(
    initialCustomization?.size || "Regular"
  );
  const [selectedMilk, setSelectedMilk] = useState<MilkOption>(
    initialCustomization?.milk || "Regular Milk"
  );
  const [selectedSweetness, setSelectedSweetness] = useState<SweetnessLevel>(
    initialCustomization?.sweetness || "Regular"
  );
  const [selectedToppings, setSelectedToppings] = useState<DrinkTopping[]>(
    initialCustomization?.toppings || []
  );
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic real-time calculation of extra charges and unit price
  const { extraPrice, unitPrice, totalPrice } = useMemo(() => {
    if (!product) return { extraPrice: 0, unitPrice: 0, totalPrice: 0 };

    const extra = calculateCustomizationPrice(config, {
      size: selectedSize,
      milk: selectedMilk,
      sweetness: selectedSweetness,
      toppings: selectedToppings,
    });

    const unit = product.price + extra;
    const total = unit * quantity;

    return { extraPrice: extra, unitPrice: unit, totalPrice: total };
  }, [product, config, selectedSize, selectedMilk, selectedSweetness, selectedToppings, quantity]);

  if (!isOpen || !product) return null;

  const toggleTopping = (toppingId: DrinkTopping) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((t) => t !== toppingId)
        : [...prev, toppingId]
    );
  };

  const validateAndSubmit = () => {
    setValidationError(null);

    // Validation 1: Size chosen and available
    const sizeOpt = config.sizes.find((s) => s.id === selectedSize);
    if (!sizeOpt || sizeOpt.isAvailable === false) {
      setValidationError("Selected cup size is unavailable.");
      return;
    }

    // Validation 2: Milk chosen and available
    const milkOpt = config.milks.find((m) => m.id === selectedMilk);
    if (!milkOpt || milkOpt.isAvailable === false) {
      setValidationError("Selected milk option is currently unavailable.");
      return;
    }

    // Validation 3: Sweetness chosen and available
    const sweetOpt = config.sweetness.find((sw) => sw.id === selectedSweetness);
    if (!sweetOpt || sweetOpt.isAvailable === false) {
      setValidationError("Selected sweetness level is unavailable.");
      return;
    }

    // Validation 4: Toppings available
    for (const topId of selectedToppings) {
      const topOpt = config.toppings.find((t) => t.id === topId);
      if (!topOpt || topOpt.isAvailable === false) {
        setValidationError(`Topping "${topId}" is currently out of stock.`);
        return;
      }
    }

    const customization: DrinkCustomizationSelection = {
      size: selectedSize,
      milk: selectedMilk,
      sweetness: selectedSweetness,
      toppings: selectedToppings,
      customizationPrice: extraPrice,
      unitPrice,
    };

    if (isEditing && editingCartItemId && onUpdateCartItem) {
      onUpdateCartItem(editingCartItemId, customization, quantity);
    } else {
      onAddToCart(product, customization, quantity);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#3B241A]/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#3B241A]/10 animate-in zoom-in-95 duration-200 z-10">
        {/* Sticky Header with Title & Close */}
        <div className="flex items-center justify-between border-b border-[#3B241A]/10 px-6 py-4 bg-[#FBF8F3]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B241A] text-white">
              <Coffee className="h-4 w-4 text-[#C58A4A]" />
            </div>
            <div>
              <h2
                id="modal-product-title"
                className="font-serif text-lg sm:text-xl font-bold text-[#3B241A] leading-tight"
              >
                {isEditing ? `Edit: ${product.name}` : product.name}
              </h2>
              <span className="text-xs text-[#6F4935]">
                {product.origin} • {product.brewMethod}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6F4935] hover:bg-white hover:text-[#3B241A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A]"
            aria-label="Close product view"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-7">
          {/* Top: Product Visual & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="relative aspect-[4/3] sm:col-span-5 overflow-hidden rounded-2xl bg-[#F6F0E7] border border-[#3B241A]/10">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 35vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-[#3B241A]">
                  F&B
                </div>
              )}
            </div>

            <div className="sm:col-span-7 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="caramel" size="sm">
                  {product.category}
                </Badge>
                {product.isBestSeller && (
                  <Badge variant="chocolate" size="sm">
                    ★ Bestseller
                  </Badge>
                )}
                <span className="text-xs text-[#6F4935] font-medium">
                  Base: {formatPrice(product.price)}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#6F4935] leading-relaxed">
                {product.description}
              </p>

              {/* Flavor Profile Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.notes.map((note) => (
                  <span
                    key={note}
                    className="rounded-md bg-[#F6F0E7] px-2 py-0.5 text-[11px] font-medium text-[#5C3B29] border border-[#3B241A]/5"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* CUSTOMIZATION OPTIONS */}
          <div className="space-y-6 border-t border-[#3B241A]/10 pt-6">
            {/* 1. CUP SIZE */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3B241A] block">
                  1. Cup Size <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#6F4935]">Required</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {config.sizes.map((sizeOpt) => {
                  const isSelected = selectedSize === sizeOpt.id;
                  const isAvailable = sizeOpt.isAvailable !== false;
                  return (
                    <button
                      key={sizeOpt.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(sizeOpt.id)}
                      className={`relative flex items-center justify-between rounded-xl p-3.5 text-left border transition-all ${
                        !isAvailable
                          ? "opacity-45 bg-gray-100 border-gray-200 cursor-not-allowed"
                          : isSelected
                          ? "border-[#3B241A] bg-[#3B241A] text-white shadow-xs"
                          : "border-[#3B241A]/15 bg-white text-[#3B241A] hover:bg-[#FBF8F3] hover:border-[#3B241A]/30"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{sizeOpt.name}</span>
                        {!isAvailable && (
                          <span className="text-[10px] text-red-500 font-semibold">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? "text-[#C58A4A]" : "text-[#6F4935]"
                        }`}
                      >
                        {sizeOpt.price > 0 ? `+${formatPrice(sizeOpt.price)}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. MILK CHOICE */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3B241A] block">
                  2. Milk Choice <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#6F4935]">Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {config.milks.map((milkOpt) => {
                  const isSelected = selectedMilk === milkOpt.id;
                  const isAvailable = milkOpt.isAvailable !== false;
                  return (
                    <button
                      key={milkOpt.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedMilk(milkOpt.id)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-left border transition-all ${
                        !isAvailable
                          ? "opacity-45 bg-gray-100 border-gray-200 cursor-not-allowed"
                          : isSelected
                          ? "border-[#3B241A] bg-[#3B241A] text-white shadow-xs"
                          : "border-[#3B241A]/15 bg-white text-[#3B241A] hover:bg-[#FBF8F3] hover:border-[#3B241A]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[#C58A4A] bg-[#C58A4A]"
                              : "border-[#3B241A]/30"
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className="text-xs font-medium">{milkOpt.name}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? "text-[#C58A4A]" : "text-[#6F4935]"
                        }`}
                      >
                        {!isAvailable
                          ? "Sold out"
                          : milkOpt.price > 0
                          ? `+${formatPrice(milkOpt.price)}`
                          : "Free"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. SWEETNESS LEVEL */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3B241A] block">
                  3. Sweetness Level <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#6F4935]">Required</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {config.sweetness.map((sweetOpt) => {
                  const isSelected = selectedSweetness === sweetOpt.id;
                  const isAvailable = sweetOpt.isAvailable !== false;
                  return (
                    <button
                      key={sweetOpt.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSweetness(sweetOpt.id)}
                      className={`rounded-xl py-2.5 px-3 text-center border transition-all ${
                        !isAvailable
                          ? "opacity-45 bg-gray-100 cursor-not-allowed"
                          : isSelected
                          ? "border-[#3B241A] bg-[#3B241A] text-white shadow-xs"
                          : "border-[#3B241A]/15 bg-white text-[#3B241A] hover:bg-[#FBF8F3]"
                      }`}
                    >
                      <span className="block text-xs font-bold">{sweetOpt.id}</span>
                      <span
                        className={`block text-[10px] ${
                          isSelected ? "text-[#C58A4A]" : "text-[#6F4935]"
                        }`}
                      >
                        {sweetOpt.name.replace(/^[^(]+/, "") || "Standard"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. OPTIONAL TOPPINGS */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3B241A] block">
                  4. Add Delicious Toppings
                </label>
                <span className="text-[11px] text-[#6F4935]">Optional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {config.toppings.map((topOpt) => {
                  const isChecked = selectedToppings.includes(topOpt.id);
                  const isAvailable = topOpt.isAvailable !== false;
                  return (
                    <button
                      key={topOpt.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => toggleTopping(topOpt.id)}
                      className={`flex items-center justify-between rounded-xl p-3 border text-left transition-all ${
                        !isAvailable
                          ? "opacity-45 bg-gray-100 cursor-not-allowed"
                          : isChecked
                          ? "border-[#C58A4A] bg-[#C58A4A]/10 text-[#3B241A]"
                          : "border-[#3B241A]/15 bg-white text-[#3B241A] hover:bg-[#FBF8F3]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-[#C58A4A] border-[#C58A4A]"
                              : "border-[#3B241A]/30 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-xs font-medium">{topOpt.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#C58A4A]">
                        +{formatPrice(topOpt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="border-t border-[#3B241A]/10 bg-[#FBF8F3] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Controls & Dynamic Price Breakdown */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex items-center rounded-full border border-[#3B241A]/20 bg-white px-3 py-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 text-[#3B241A] hover:text-[#C58A4A] transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-serif text-sm font-bold text-[#3B241A]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 text-[#3B241A] hover:text-[#C58A4A] transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[10px] uppercase tracking-wider text-[#6F4935] font-semibold block">
                {quantity > 1 ? `${quantity} × ${formatPrice(unitPrice)}` : "Customized Total"}
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#3B241A]">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Add / Update CTA Button */}
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto min-w-[220px] justify-center gap-2 shadow-sm"
            onClick={validateAndSubmit}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{isEditing ? "Updated in Cart" : "Added to Cart"}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {isEditing
                    ? `Update Drink • ${formatPrice(totalPrice)}`
                    : `Add to Cart • ${formatPrice(totalPrice)}`}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
