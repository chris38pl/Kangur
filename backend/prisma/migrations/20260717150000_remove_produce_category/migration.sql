-- Remap legacy "produce" (Świeże) into vegetables, then drop the enum value.
UPDATE "ShoppingItem" SET "category" = 'vegetables' WHERE "category" = 'produce';

ALTER TYPE "ShoppingCategory" RENAME TO "ShoppingCategory_old";

CREATE TYPE "ShoppingCategory" AS ENUM (
    'fruit',
    'vegetables',
    'dairy',
    'meat',
    'fish',
    'bakery',
    'frozen',
    'drinks',
    'alcohol',
    'snacks',
    'household',
    'cleaning',
    'baby',
    'pets',
    'pharmacy',
    'cosmetics',
    'electronics',
    'office',
    'garden',
    'diy',
    'other'
);

ALTER TABLE "ShoppingItem"
  ALTER COLUMN "category" TYPE "ShoppingCategory"
  USING ("category"::text::"ShoppingCategory");

DROP TYPE "ShoppingCategory_old";
