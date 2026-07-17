-- Add amount, backfill from quantity/unit, then drop old columns.

ALTER TABLE "ShoppingItem" ADD COLUMN "amount" TEXT;

UPDATE "ShoppingItem"
SET "amount" = CASE
  WHEN "quantity" IS NOT NULL AND "unit" IS NOT NULL THEN TRIM("quantity" || ' ' || "unit")
  WHEN "quantity" IS NOT NULL THEN "quantity"
  WHEN "unit" IS NOT NULL THEN "unit"
  ELSE NULL
END;

ALTER TABLE "ShoppingItem" DROP COLUMN "quantity";
ALTER TABLE "ShoppingItem" DROP COLUMN "unit";
