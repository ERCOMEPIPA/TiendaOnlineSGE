-- =====================================================
-- FashionStore - Reviews System Migration
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add reviews functionality

-- =====================================================
-- 1. REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- Unique constraint: One review per user per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_user_product 
  ON reviews(product_id, user_id);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Public read reviews" 
  ON reviews FOR SELECT 
  USING (true);

-- Authenticated users can create reviews (but only one per product)
CREATE POLICY "Authenticated users can insert reviews" 
  ON reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews
CREATE POLICY "Users can update own reviews" 
  ON reviews FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own reviews
CREATE POLICY "Users can delete own reviews" 
  ON reviews FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. HELPER FUNCTION: Get product rating stats
-- =====================================================

CREATE OR REPLACE FUNCTION get_product_rating_stats(p_product_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews BIGINT,
  rating_5 BIGINT,
  rating_4 BIGINT,
  rating_3 BIGINT,
  rating_2 BIGINT,
  rating_1 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0) as average_rating,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1
  FROM reviews
  WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. SAMPLE REVIEWS (Optional)
-- =====================================================

-- Uncomment to add sample reviews for testing
-- INSERT INTO reviews (product_id, user_id, user_name, user_email, rating, title, comment, verified_purchase)
-- SELECT 
--   p.id,
--   auth.uid(),
--   'Usuario Demo',
--   'demo@test.com',
--   5,
--   'Excelente producto',
--   'La calidad es increíble, muy satisfecho con la compra.',
--   true
-- FROM products p
-- WHERE p.slug = 'camiseta-tour-2024-bad-bunny'
-- LIMIT 1;
