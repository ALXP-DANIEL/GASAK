-- Auth slides become image-only: drop copy/sort columns.
ALTER TABLE gasak_auth_slides
  DROP COLUMN IF EXISTS eyebrow,
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS sort_order;

-- Public gallery (unlimited images, each with title/description).
CREATE TABLE IF NOT EXISTS gasak_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gasak_galleries_active_idx
  ON gasak_galleries (active, sort_order);

-- Merch product supplementary gallery (max 3, enforced in app layer).
CREATE TABLE IF NOT EXISTS gasak_product_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL
    REFERENCES gasak_products (id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gasak_product_gallery_product_idx
  ON gasak_product_gallery (product_id);
