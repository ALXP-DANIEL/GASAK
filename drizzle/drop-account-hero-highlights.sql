-- Drop the hero count and "other highlights" fields from account listings.
--
-- Both were removed from the seller form and the public listing page (they
-- were noise for the buy/sell flow), so the columns have no remaining writers
-- or readers.

ALTER TABLE gasak_product_account_details
  DROP COLUMN IF EXISTS hero_count,
  DROP COLUMN IF EXISTS highlights;
