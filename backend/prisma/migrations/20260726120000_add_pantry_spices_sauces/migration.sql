-- Additive ShoppingCategory aisles for dry goods / spices / sauces.
ALTER TYPE "ShoppingCategory" ADD VALUE IF NOT EXISTS 'pantry';
ALTER TYPE "ShoppingCategory" ADD VALUE IF NOT EXISTS 'spices';
ALTER TYPE "ShoppingCategory" ADD VALUE IF NOT EXISTS 'sauces';
