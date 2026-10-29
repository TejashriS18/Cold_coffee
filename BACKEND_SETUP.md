# FROST & BEAN Backend Documentation

This document covers the backend architecture, PostgreSQL database models, Prisma ORM configuration, security implementations, seed commands, and server-side API endpoints for **FROST & BEAN Cold Brew Roastery**.

---

## 1. Architecture Overview

- **Framework**: Next.js App Router (Server-side API Route Handlers)
- **Database**: PostgreSQL 18+ (Embedded local cluster or external instance like Neon, Supabase, AWS RDS)
- **ORM**: Prisma 7 with `@prisma/adapter-pg` connection pooling
- **Validation**: Zod schema validation on all incoming request payloads
- **Authentication**: JWT with Role-Based Access Control (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `BARISTA`, `CUSTOMER`)
- **Security**:
  - Bcrypt hashing with 10 salt rounds
  - Customer PII and password hashes protected from public responses
  - Payment gateway references stored; raw card details (PAN/CVV) never stored
  - Server-authoritative price calculation (zero client trust, price spoofing defense)
  - Idempotency key tracking to eliminate duplicate order submission
  - Atomic database transactions with automated stock restoration upon failed payment or cancellation
  - Secret and PII redaction in structured logger

---

## 2. Environment Variables Setup

Create a `.env` file in the root directory (based on `.env.example`):

```env
# PostgreSQL Database Connection URL
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:54329/frostbean?schema=public"

# Database Configuration for Embedded PostgreSQL (if using built-in cluster)
PGPORT=54329
PGUSER=postgres
PGPASSWORD=postgrespassword
PGDATABASE=frostbean

# JWT Secret for Server-side Role Authorization
JWT_SECRET="frost_and_bean_secure_jwt_secret_key_2026_super_safe"

# Default Admin Seed Credentials
ADMIN_DEFAULT_EMAIL="admin@frostbean.com"
ADMIN_DEFAULT_PASSWORD="Admin@FrostBean2026!"

# Application Environment
NODE_ENV="development"
```

---

## 3. Database Commands

### Start Local PostgreSQL Cluster
Starts the persistent PostgreSQL database cluster on port `54329`:
```bash
npm run db:start
```

### Stop Local PostgreSQL Cluster
```bash
npm run db:stop
```

### Apply Migrations
Applies existing migrations to synchronize your PostgreSQL database:
```bash
npm run db:migrate
```

### Push Schema Directly (Prototyping)
```bash
npm run db:push
```

### Seed Database
Seeds categories, products, customization options, initial inventory, promotional discount codes, and admin accounts:
```bash
npm run db:seed
```

### Launch Prisma Studio (Visual DB GUI)
```bash
npm run db:studio
```

---

## 4. Database Models

The PostgreSQL database contains 10 models:

1. **`Category` (`categories`)**
   - Categories for menu grouping (`Classic`, `Chocolate`, `Caramel`, `Special`).
   - Fields: `id`, `name`, `slug`, `description`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`.
   - Relation: `products Product[]`.

2. **`Product` (`products`)**
   - Coffee products with origin, tasting notes array, roast level, brew method, and pricing.
   - Fields: `id`, `slug`, `name`, `tagline`, `description`, `price` (INR), `pricePaise`, `origin`, `categoryId`, `roastLevel`, `brewMethod`, `notes` (text[]), `intensity`, `isBestSeller`, `isLimitedRelease`, `image`, `accentColor`, `isActive`, `createdAt`, `updatedAt`.
   - Relations: `category Category`, `customizationOptions CustomizationOption[]`, `inventory Inventory?`, `orderItems OrderItem[]`.

3. **`CustomizationOption` (`customization_options`)**
   - Drink customization attributes: cup sizes, milk choices, sweetness levels, and toppings.
   - Fields: `id`, `type` (`SIZE`, `MILK`, `SWEETNESS`, `TOPPING`), `name`, `code`, `price` (INR), `pricePaise`, `isAvailable`, `displayOrder`, `productId?`, `createdAt`, `updatedAt`.
   - Relation: `product Product?`.

4. **`Customer` (`customers`)**
   - Registered and guest customer profiles with sanitized mobile and address.
   - Fields: `id`, `name`, `email?`, `mobile`, `passwordHash?`, `address?`, `createdAt`, `updatedAt`.
   - Relation: `orders Order[]`.

5. **`AdminUser` (`admin_users`)**
   - Backoffice staff with role-based permissions (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `BARISTA`).
   - Fields: `id`, `email`, `name`, `passwordHash`, `role`, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt`.

6. **`PromotionalOffer` (`promotional_offers`)**
   - Discount codes (`PERCENTAGE`, `FIXED`, `FREE_SHIPPING`) with minimum spend and redemption tracking.
   - Fields: `id`, `code`, `description`, `discountType`, `discountValue`, `minOrderPaise`, `minItems`, `maxDiscountPaise`, `usageLimit`, `timesUsed`, `validFrom`, `validTo`, `isActive`, `createdAt`, `updatedAt`.
   - Relation: `orders Order[]`.

7. **`Inventory` (`inventory`)**
   - Real-time stock counting, reserved quantity tracking, and low-stock alerts.
   - Fields: `id`, `productId`, `stockCount`, `reservedCount`, `lowStockThreshold`, `isAvailable`, `lastRestockedAt`, `createdAt`, `updatedAt`.
   - Relation: `product Product`.

8. **`Order` (`orders`)**
   - Master order records with unique human-readable reference, idempotency key, financial totals, and lifecycle tracking.
   - Fields: `id`, `orderNumber`, `idempotencyKey?`, `customerId?`, `customerName`, `customerMobile`, `customerAddress`, `deliveryInstructions?`, `subtotalPaise`, `discountPaise`, `deliveryFeePaise`, `taxPaise`, `totalPaise`, `promoCode?`, `promoOfferId?`, `paymentMethod` (`ONLINE`, `COD`), `paymentStatus` (`PENDING`, `PAID`, `FAILED`, `COD_PENDING`), `orderStatus` (`CREATED`, `CONFIRMED`, `PREPARING`, `DELIVERED`, `CANCELLED`, `PAYMENT_FAILED`), `createdAt`, `updatedAt`.
   - Relations: `customer Customer?`, `promoOffer PromotionalOffer?`, `items OrderItem[]`, `payments Payment[]`.

9. **`OrderItem` (`order_items`)**
   - Immutable snapshot of line items with customized configuration and unit prices.
   - Fields: `id`, `orderId`, `productId`, `productName`, `productImage?`, `basePricePaise`, `customizationJson`, `unitPricePaise`, `quantity`, `lineTotalPaise`, `createdAt`.
   - Relations: `order Order`, `product Product`.

10. **`Payment` (`payments`)**
    - Secure payment references and audit trail. Raw payment card details are never saved.
    - Fields: `id`, `orderId`, `gateway` (`mock`, `razorpay`, `cod`), `transactionReference?`, `paymentSignature?`, `amountPaise`, `status` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`, `COD_PENDING`), `failureReason?`, `verifiedAt?`, `rawMetadata?`, `createdAt`, `updatedAt`.
    - Relation: `order Order`.

---

## 5. API Endpoints Reference

### Checkout & Orders
- `POST /api/checkout/create-order`
  - Creates an order inside an atomic transaction.
  - Server recalculates prices authoritatively.
  - Verifies stock and decrements inventory.
  - Supports `idempotencyKey` to avoid double orders.
- `POST /api/checkout/mock-gateway/process`
  - Simulates payment gateway processing and issues cryptographic HMAC signatures.
- `POST /api/checkout/verify-payment`
  - Verifies cryptographic signature and confirms order payment atomically. Restores inventory on failure.
- `GET /api/orders/[orderId]`
  - Retrieves order details by human-friendly order ID (e.g., `FB-20261019-XXXX`).

### Product Catalog
- `GET /api/products` (Optional query params: `?category=classic`, `?bestSellers=true`)
- `GET /api/products/[id]`
- `POST /api/products` (Admin protected)
- `PATCH /api/products/[id]` (Admin protected)
- `GET /api/categories`

### Customer Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Protected with customer Bearer token)

### Admin Management (Role-Protected)
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/[orderId]` (Update order lifecycle or mark as cancelled with auto-stock restock)
- `GET /api/admin/inventory` (Live inventory report with low-stock flags)
- `PATCH /api/admin/inventory/[productId]` (Restock or adjust thresholds)
- `GET /api/admin/promotions`
- `POST /api/admin/promotions`

---

## 6. Seed Accounts

For development and testing, run `npm run db:seed`. This creates:

- **Super Admin**:
  - Email: `admin@frostbean.com`
  - Password: `Admin@FrostBean2026!`
  - Role: `SUPER_ADMIN`
- **Store Manager**:
  - Email: `manager@frostbean.com`
  - Password: `Admin@FrostBean2026!`
  - Role: `MANAGER`
- **Sample Customer**:
  - Email: `rohit.sharma@example.com`
  - Mobile: `9876543210`
