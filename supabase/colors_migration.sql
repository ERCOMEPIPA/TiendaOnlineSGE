-- Add colors column to products table
-- Colors are stored as array of strings in format "ColorName:#HexCode"
-- Example: ["Negro:#000000", "Blanco:#FFFFFF", "Rojo:#DC2626"]

ALTER TABLE products ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN products.colors IS 'Array of colors in format "Name:#HexCode"';
