import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:54329/frostbean?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding for FROST & BEAN...");

  // 1. Seed Categories
  console.log("Seeding Categories...");
  const categoriesData = [
    { id: "cat-classic", name: "Classic", slug: "classic", description: "Timeless slow-steeped cold brews and iced coffees", displayOrder: 1 },
    { id: "cat-chocolate", name: "Chocolate", slug: "chocolate", description: "Decadent dark cocoa infused chilled blends", displayOrder: 2 },
    { id: "cat-caramel", name: "Caramel", slug: "caramel", description: "Velvety ribbons of golden salted caramel and sweet cream", displayOrder: 3 },
    { id: "cat-special", name: "Special", slug: "special", description: "Chef specials, artisanal distillations, and limited releases", displayOrder: 4 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, displayOrder: cat.displayOrder },
      create: cat,
    });
  }

  // 2. Seed Products
  console.log("Seeding Products...");
  const productsData = [
    {
      id: "classic-chill",
      slug: "classic-chill",
      name: "Classic Chill",
      tagline: "Slow-steeped bold cold coffee layered with chilled milk and crystal ice.",
      description: "Our signature blend of Ethiopian Arabica steeped cold for 24 hours. Exceptionally smooth, balanced with rich fresh cream and subtle dark cocoa undertones.",
      price: 99,
      pricePaise: 9900,
      origin: "Yirgacheffe, Ethiopia",
      categoryId: "cat-classic",
      roastLevel: "Medium",
      brewMethod: "Slow Steeped 24h",
      notes: ["Dark Cocoa", "Fresh Cream", "Roasted Nut"],
      intensity: 3,
      isBestSeller: true,
      isLimitedRelease: false,
      image: "/images/creamy-milk-cold-coffee.jpg",
      accentColor: "#D4A373",
    },
    {
      id: "caramel-bliss",
      slug: "caramel-bliss",
      name: "Caramel Bliss",
      tagline: "Velvety cold coffee laced with handcrafted salted caramel drizzle.",
      description: "Cold extraction poured over dense ice cubes, swirled with golden caramel ribbons and a sprinkle of gourmet sea salt crystals for a sweet, buttery finish.",
      price: 129,
      pricePaise: 12900,
      origin: "Antigua, Guatemala",
      categoryId: "cat-caramel",
      roastLevel: "Medium",
      brewMethod: "Signature Shaken",
      notes: ["Salted Caramel", "Buttery Toffee", "Sweet Cream"],
      intensity: 4,
      isBestSeller: true,
      isLimitedRelease: false,
      image: "/images/iced-caramel-latte.jpg",
      accentColor: "#C68B59",
    },
    {
      id: "vanilla-dream",
      slug: "vanilla-dream",
      name: "Vanilla Dream",
      tagline: "Smooth iced cold brew infused with organic Madagascar vanilla bean.",
      description: "Slow-dripped Arabica steeped with aromatic vanilla beans and topped with cold sweet cream. Gentle floral sweetness with zero harsh bitterness.",
      price: 119,
      pricePaise: 11900,
      origin: "Huila, Colombia",
      categoryId: "cat-classic",
      roastLevel: "Light",
      brewMethod: "Slow Steeped 24h",
      notes: ["Bourbon Vanilla", "Floral Jasmine", "Honey Cream"],
      intensity: 2,
      isBestSeller: false,
      isLimitedRelease: false,
      image: "/images/vanilla-dream.jpg",
      accentColor: "#E8D8C8",
    },
    {
      id: "choco-mocha",
      slug: "choco-mocha",
      name: "Choco Mocha",
      tagline: "Decadent dark chocolate ganache and bold cold brew dusted with cocoa.",
      description: "Rich melted dark chocolate syrup cascading through chilled espresso cold brew, finished with velvety milk foam and a dusting of Dutch cocoa powder.",
      price: 149,
      pricePaise: 14900,
      origin: "Minas Gerais, Brazil",
      categoryId: "cat-chocolate",
      roastLevel: "Dark",
      brewMethod: "Signature Shaken",
      notes: ["Dark Chocolate", "Dutch Cocoa", "Brown Sugar"],
      intensity: 5,
      isBestSeller: true,
      isLimitedRelease: false,
      image: "/images/choco-mocha.jpg",
      accentColor: "#582F0E",
    },
    {
      id: "hazelnut-heaven",
      slug: "hazelnut-heaven",
      name: "Hazelnut Heaven",
      tagline: "Toasted hazelnut praline syrup layered into ultra-smooth cold coffee.",
      description: "Roasted Mediterranean hazelnut extract whipped with cold brew and chilled whole milk. Nutty, fragrant, and luxurious in every sip.",
      price: 159,
      pricePaise: 15900,
      origin: "San Marcos, Guatemala",
      categoryId: "cat-special",
      roastLevel: "Medium",
      brewMethod: "Cold Distilled",
      notes: ["Toasted Hazelnut", "Praline Cream", "Golden Honey"],
      intensity: 4,
      isBestSeller: false,
      isLimitedRelease: false,
      image: "/images/hazelnut-heaven.jpg",
      accentColor: "#7F4F24",
    },
    {
      id: "oreo-cold-coffee",
      slug: "oreo-cold-coffee",
      name: "Oreo Cold Coffee",
      tagline: "Crunchy chocolate sandwich cookies blended into thick cold cream brew.",
      description: "The ultimate indulgence: crushed crunchy Oreo cookies folded into a creamy cold coffee base, crowned with cookie crumbles and chocolate drizzle.",
      price: 169,
      pricePaise: 16900,
      origin: "Chiapas, Mexico",
      categoryId: "cat-special",
      roastLevel: "Medium",
      brewMethod: "Signature Shaken",
      notes: ["Oreo Cookie", "Vanilla Cream", "Cocoa Crunch"],
      intensity: 4,
      isBestSeller: false,
      isLimitedRelease: true,
      image: "/images/oreo-cold-coffee.jpg",
      accentColor: "#333333",
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: prod,
      create: prod,
    });
  }

  // 3. Seed Customization Options (Global and Product-Specific)
  console.log("Seeding Customization Options...");
  // Clear existing options to keep seed idempotent
  await prisma.customizationOption.deleteMany({});

  const globalOptions = [
    // Sizes
    { type: "SIZE", name: "Regular (12 oz)", code: "Regular", price: 0, pricePaise: 0, isAvailable: true, displayOrder: 1 },
    { type: "SIZE", name: "Large (16 oz)", code: "Large", price: 30, pricePaise: 3000, isAvailable: true, displayOrder: 2 },
    // Milks
    { type: "MILK", name: "Regular Milk", code: "Regular Milk", price: 0, pricePaise: 0, isAvailable: true, displayOrder: 1 },
    { type: "MILK", name: "Creamy Oat Milk", code: "Oat Milk", price: 25, pricePaise: 2500, isAvailable: true, displayOrder: 2 },
    { type: "MILK", name: "Roasted Almond Milk", code: "Almond Milk", price: 25, pricePaise: 2500, isAvailable: true, displayOrder: 3 },
    { type: "MILK", name: "Organic Soy Milk", code: "Soy Milk", price: 20, pricePaise: 2000, isAvailable: true, displayOrder: 4 },
    // Sweetness
    { type: "SWEETNESS", name: "Less Sweet (50%)", code: "Less", price: 0, pricePaise: 0, isAvailable: true, displayOrder: 1 },
    { type: "SWEETNESS", name: "Regular Sweet (100%)", code: "Regular", price: 0, pricePaise: 0, isAvailable: true, displayOrder: 2 },
    { type: "SWEETNESS", name: "Extra Sweet (125%)", code: "Extra", price: 0, pricePaise: 0, isAvailable: true, displayOrder: 3 },
    // Toppings
    { type: "TOPPING", name: "Velvety Whipped Cream", code: "Whipped Cream", price: 20, pricePaise: 2000, isAvailable: true, displayOrder: 1 },
    { type: "TOPPING", name: "Rich Chocolate Drizzle", code: "Chocolate Drizzle", price: 15, pricePaise: 1500, isAvailable: true, displayOrder: 2 },
    { type: "TOPPING", name: "Cold Espresso Extra Shot", code: "Extra Coffee Shot", price: 30, pricePaise: 3000, isAvailable: true, displayOrder: 3 },
    { type: "TOPPING", name: "Artisanal Caramel Drizzle", code: "Caramel Drizzle", price: 15, pricePaise: 1500, isAvailable: true, displayOrder: 4 },
  ];

  for (const opt of globalOptions) {
    await prisma.customizationOption.create({
      data: opt,
    });
  }

  // 4. Seed Inventory for each product
  console.log("Seeding Inventory...");
  for (const prod of productsData) {
    await prisma.inventory.upsert({
      where: { productId: prod.id },
      update: {
        stockCount: 100,
        reservedCount: 0,
        lowStockThreshold: 10,
        isAvailable: true,
      },
      create: {
        productId: prod.id,
        stockCount: 100,
        reservedCount: 0,
        lowStockThreshold: 10,
        isAvailable: true,
      },
    });
  }

  // 5. Seed Promotional Offers
  console.log("Seeding Promotional Offers...");
  const promoOffersData = [
    {
      code: "CHILL20",
      description: "20% off on your entire cold order",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderPaise: 0,
      minItems: 0,
      isActive: true,
    },
    {
      code: "FROSTDUO",
      description: "Flat Rs. 50 off on orders above Rs. 200",
      discountType: "FIXED",
      discountValue: 5000,
      minOrderPaise: 20000,
      minItems: 0,
      isActive: true,
    },
    {
      code: "BROWNIE50",
      description: "Flat Rs. 50 off Coffee & Brownie pairing (min order Rs. 200)",
      discountType: "FIXED",
      discountValue: 5000,
      minOrderPaise: 20000,
      minItems: 0,
      isActive: true,
    },
    {
      code: "B2G1FREE",
      description: "Buy 2 Get 1 Free (Rs. 99 discount on 3+ drinks)",
      discountType: "FIXED",
      discountValue: 9900,
      minOrderPaise: 0,
      minItems: 3,
      isActive: true,
    },
    {
      code: "SEASONAL20",
      description: "20% off Seasonal Harvest Cold Brews",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderPaise: 0,
      minItems: 0,
      isActive: true,
    },
    {
      code: "NITROGLOW",
      description: "15% off artisanal brews",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderPaise: 0,
      minItems: 0,
      isActive: true,
    },
    {
      code: "FREESHIP",
      description: "Free express cold delivery on any order",
      discountType: "FREE_SHIPPING",
      discountValue: 0,
      minOrderPaise: 0,
      minItems: 0,
      isActive: true,
    },
  ];

  for (const promo of promoOffersData) {
    await prisma.promotionalOffer.upsert({
      where: { code: promo.code },
      update: promo,
      create: promo,
    });
  }

  // 6. Seed Admin Users with Bcrypt Hashed Passwords
  console.log("Seeding Admin Users...");
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@FrostBean2026!";
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);

  await prisma.adminUser.upsert({
    where: { email: "admin@frostbean.com" },
    update: {
      name: "Master Brewer (Super Admin)",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email: "admin@frostbean.com",
      name: "Master Brewer (Super Admin)",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: "manager@frostbean.com" },
    update: {
      name: "Store Manager",
      passwordHash: adminPasswordHash,
      role: "MANAGER",
      isActive: true,
    },
    create: {
      email: "manager@frostbean.com",
      name: "Store Manager",
      passwordHash: adminPasswordHash,
      role: "MANAGER",
      isActive: true,
    },
  });

  // 7. Seed Sample Customer
  console.log("Seeding Sample Customer...");
  await prisma.customer.upsert({
    where: { email: "rohit.sharma@example.com" },
    update: {
      name: "Rohit Sharma",
      mobile: "9876543210",
      address: "Flat 402, Palm Heights, 100ft Road, Indiranagar, Bengaluru, 560038",
    },
    create: {
      name: "Rohit Sharma",
      email: "rohit.sharma@example.com",
      mobile: "9876543210",
      address: "Flat 402, Palm Heights, 100ft Road, Indiranagar, Bengaluru, 560038",
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
