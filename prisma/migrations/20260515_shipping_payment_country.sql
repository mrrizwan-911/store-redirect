-- Migration: add_shipping_option_and_order_country
-- Run: npx prisma migrate dev --name shipping_payment_country
-- Or in production: npx prisma migrate deploy

-- 1. Create ShippingOption table
CREATE TABLE "ShippingOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "estimatedDays" TEXT,
    "countries" TEXT[] NOT NULL DEFAULT '{}',
    "freeShippingThreshold" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShippingOption_pkey" PRIMARY KEY ("id")
);

-- 2. Add index on isActive for fast lookup
CREATE INDEX "ShippingOption_isActive_idx" ON "ShippingOption"("isActive");

-- 3. Add country column to Order (tracks which regional site the order came from)
ALTER TABLE "Order" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'PK';

-- 4. Add shippingOptionId column to Order (nullable FK to ShippingOption)
ALTER TABLE "Order" ADD COLUMN "shippingOptionId" TEXT;

-- 5. Add foreign key constraint for shippingOptionId
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingOptionId_fkey"
    FOREIGN KEY ("shippingOptionId") REFERENCES "ShippingOption"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Add index on country for fast filtering
CREATE INDEX "Order_country_idx" ON "Order"("country");

-- 7. Seed some default shipping options so checkout doesn't break immediately
-- (Admin can edit/delete these from the dashboard)
INSERT INTO "ShippingOption" ("id", "name", "description", "price", "estimatedDays", "countries", "freeShippingThreshold", "isActive", "sortOrder", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Standard Delivery', '3-5 Business Days', 200.00, '3-5 days', ARRAY['PK'], 3000.00, true, 1, NOW()),
    (gen_random_uuid()::text, 'Express Delivery', '1-2 Business Days', 500.00, '1-2 days', ARRAY['PK'], NULL, true, 2, NOW()),
    (gen_random_uuid()::text, 'Standard Shipping', '5-7 Business Days', 8.99, '5-7 days', ARRAY['UK','GLOBAL'], 50.00, true, 1, NOW()),
    (gen_random_uuid()::text, 'Express Shipping', '2-3 Business Days', 14.99, '2-3 days', ARRAY['UK','GLOBAL'], NULL, true, 2, NOW());
