-- ============================================
-- MIGRATION: Add Pinned and Banner Image to News Posts
-- Run this script in Supabase SQL Editor
-- ============================================

-- 1. Add is_pinned column to news_posts table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'news_posts' 
    AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE public.news_posts ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Add banner_image_url column to news_posts table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'news_posts' 
    AND column_name = 'banner_image_url'
  ) THEN
    ALTER TABLE public.news_posts ADD COLUMN banner_image_url text;
  END IF;
END $$;

-- 3. Create index for faster sorting (pinned posts first)
CREATE INDEX IF NOT EXISTS idx_news_posts_pinned_created 
ON public.news_posts(is_pinned DESC, created_at DESC);

-- ============================================
-- Migration Complete
-- ============================================

