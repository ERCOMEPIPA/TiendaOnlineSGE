-- =====================================================
-- FashionStore - Database Schema for Supabase
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- 1. TABLES
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents (3500 = 35.00€)
  stock INTEGER DEFAULT 0,
  sizes TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  artist TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total INTEGER NOT NULL, -- Total in cents
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_artist ON products(artist);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Public read categories" 
  ON categories FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert categories" 
  ON categories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" 
  ON categories FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories" 
  ON categories FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Products policies
CREATE POLICY "Public read products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert products" 
  ON products FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" 
  ON products FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" 
  ON products FOR DELETE 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. SEED DATA (Optional sample data)
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES
  ('Camisetas', 'camisetas'),
  ('Sudaderas', 'sudaderas'),
  ('Accesorios', 'accesorios')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, price, stock, sizes, featured, artist, images) VALUES
  (
    'Camiseta Tour 2024 - Bad Bunny',
    'camiseta-tour-2024-bad-bunny',
    'Camiseta oficial del World''s Hottest Tour 2024. Algodón 100% orgánico.',
    3500,
    15,
    ARRAY['S', 'M', 'L', 'XL'],
    true,
    'Bad Bunny',
    ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800']
  ),
  (
    'Sudadera Midnight - Taylor Swift',
    'sudadera-midnight-taylor-swift',
    'Sudadera Midnights Edition. Felpa premium con capucha.',
    5900,
    8,
    ARRAY['S', 'M', 'L'],
    true,
    'Taylor Swift',
    ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800']
  ),
  (
    'Gorra Logo - Drake',
    'gorra-logo-drake',
    'Gorra bordada con logo OVO. Ajustable.',
    2900,
    25,
    ARRAY['Única'],
    true,
    'Drake',
    ARRAY['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800']
  ),
  (
    'Hoodie Astroworld - Travis Scott',
    'hoodie-astroworld-travis-scott',
    'Hoodie edición limitada Astroworld. Diseño exclusivo.',
    7500,
    3,
    ARRAY['M', 'L', 'XL'],
    true,
    'Travis Scott',
    ARRAY['https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800']
  )
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 5. STORAGE BUCKET (Run in Storage section or SQL)
-- =====================================================
-- Note: Create bucket "products-images" in Supabase Dashboard > Storage
-- Then apply these policies:

-- Enable public read for product images
-- CREATE POLICY "Public read images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'products-images');

-- Allow authenticated users to upload
-- CREATE POLICY "Authenticated upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'products-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
-- CREATE POLICY "Authenticated update images"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'products-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
-- CREATE POLICY "Authenticated delete images"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'products-images' AND auth.role() = 'authenticated');
