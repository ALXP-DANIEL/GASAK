-- Account-sale shop category.
--
-- Preferred path is `npm run db:push`, which derives all of this from schema.ts.
-- This file is the manual equivalent for applying against a DB by hand.
--
-- IMPORTANT: run STEP 1 on its own and let it commit before running STEP 2.
-- Postgres cannot use a new enum value in the same transaction that adds it,
-- so `psql -1 -f` (single transaction) over the whole file would fail. Plain
-- `psql -f` is fine because each statement autocommits.

-- ---------------------------------------------------------------- STEP 1
ALTER TYPE "product_category" ADD VALUE IF NOT EXISTS 'account';

-- ---------------------------------------------------------------- STEP 2
DO $$ BEGIN
  CREATE TYPE "account_enquiry_status" AS ENUM ('new', 'contacted', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Category-specific fields hang off products 1:1 rather than widening the
-- products table, so the next category with its own fields gets its own table.
-- No row here simply means the product is not an account listing.
CREATE TABLE IF NOT EXISTS "gasak_product_account_details" (
  "product_id" uuid PRIMARY KEY NOT NULL
    REFERENCES "gasak_products"("id") ON DELETE CASCADE,
  -- Structured MLBB rank object, same shape as player profiles.
  "rank" jsonb,
  -- Win rate percentage 0–100, e.g. 68.50.
  "win_rate" numeric(5, 2),
  "skin_count" integer,
  "hero_count" integer,
  "skin_description" text,
  "highlights" text,
  "sold" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "gasak_account_enquiries" (
  "id" uuid PRIMARY KEY NOT NULL,
  "product_id" uuid NOT NULL
    REFERENCES "gasak_products"("id") ON DELETE CASCADE,
  "buyer_name" text NOT NULL,
  "buyer_phone" text NOT NULL,
  "buyer_email" text NOT NULL,
  "note" text,
  "status" "account_enquiry_status" NOT NULL DEFAULT 'new',
  "price_sen_at_enquiry" integer NOT NULL,
  "handled_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "handled_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "gasak_account_enquiries_product_idx"
  ON "gasak_account_enquiries" ("product_id");
CREATE INDEX IF NOT EXISTS "gasak_account_enquiries_status_idx"
  ON "gasak_account_enquiries" ("status");
