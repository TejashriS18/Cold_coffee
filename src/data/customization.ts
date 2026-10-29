import {
  CupSize,
  MilkOption,
  SweetnessLevel,
  DrinkTopping,
  CustomizationOption,
  ProductCustomizationConfig,
  DrinkCustomizationSelection,
} from "@/types";

export const DEFAULT_SIZES: CustomizationOption<CupSize>[] = [
  { id: "Regular", name: "Regular (12 oz)", price: 0, isAvailable: true },
  { id: "Large", name: "Large (16 oz)", price: 30, isAvailable: true },
];

export const DEFAULT_MILKS: CustomizationOption<MilkOption>[] = [
  { id: "Regular Milk", name: "Regular Milk", price: 0, isAvailable: true },
  { id: "Oat Milk", name: "Creamy Oat Milk", price: 25, isAvailable: true },
  { id: "Almond Milk", name: "Roasted Almond Milk", price: 25, isAvailable: true },
  { id: "Soy Milk", name: "Organic Soy Milk", price: 20, isAvailable: true },
];

export const DEFAULT_SWEETNESS: CustomizationOption<SweetnessLevel>[] = [
  { id: "Less", name: "Less Sweet (50%)", price: 0, isAvailable: true },
  { id: "Regular", name: "Regular Sweet (100%)", price: 0, isAvailable: true },
  { id: "Extra", name: "Extra Sweet (125%)", price: 0, isAvailable: true },
];

export const DEFAULT_TOPPINGS: CustomizationOption<DrinkTopping>[] = [
  { id: "Whipped Cream", name: "Velvety Whipped Cream", price: 20, isAvailable: true },
  { id: "Chocolate Drizzle", name: "Rich Chocolate Drizzle", price: 15, isAvailable: true },
  { id: "Extra Coffee Shot", name: "Cold Espresso Extra Shot", price: 30, isAvailable: true },
];

export const DEFAULT_CUSTOMIZATION_CONFIG: ProductCustomizationConfig = {
  sizes: DEFAULT_SIZES,
  milks: DEFAULT_MILKS,
  sweetness: DEFAULT_SWEETNESS,
  toppings: DEFAULT_TOPPINGS,
};

/**
 * Calculates extra charges from selected customization options
 */
export function calculateCustomizationPrice(
  config: ProductCustomizationConfig,
  selection: {
    size: CupSize;
    milk: MilkOption;
    sweetness: SweetnessLevel;
    toppings: DrinkTopping[];
  }
): number {
  let extra = 0;

  const sizeOpt = config.sizes.find((s) => s.id === selection.size);
  if (sizeOpt) extra += sizeOpt.price;

  const milkOpt = config.milks.find((m) => m.id === selection.milk);
  if (milkOpt) extra += milkOpt.price;

  const sweetOpt = config.sweetness.find((sw) => sw.id === selection.sweetness);
  if (sweetOpt) extra += sweetOpt.price;

  selection.toppings.forEach((topId) => {
    const topOpt = config.toppings.find((t) => t.id === topId);
    if (topOpt) extra += topOpt.price;
  });

  return extra;
}

/**
 * Returns default selections for a given customization config
 */
export function getDefaultCustomization(
  config: ProductCustomizationConfig = DEFAULT_CUSTOMIZATION_CONFIG
): DrinkCustomizationSelection {
  const size = config.sizes.find((s) => s.isAvailable)?.id || "Regular";
  const milk = config.milks.find((m) => m.isAvailable)?.id || "Regular Milk";
  const sweetness = config.sweetness.find((sw) => sw.isAvailable)?.id || "Regular";
  const toppings: DrinkTopping[] = [];

  const extra = calculateCustomizationPrice(config, {
    size,
    milk,
    sweetness,
    toppings,
  });

  return {
    size,
    milk,
    sweetness,
    toppings,
    customizationPrice: extra,
    unitPrice: extra, // will be combined with product base price
  };
}
