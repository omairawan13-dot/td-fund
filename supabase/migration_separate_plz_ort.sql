-- ============================================
-- MIGRATION: Separate PLZ (Postal Code) and ORT (City) from Address
-- Run this script in Supabase SQL Editor
-- ============================================

-- 1. Add postal_code column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE public.users ADD COLUMN postal_code text;
  END IF;
END $$;

-- 2. Add city column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.users ADD COLUMN city text;
  END IF;
END $$;

-- 3. Migrate existing address data to postal_code and city
-- Attempt to parse PLZ (4-5 digits) and city from address string
-- Common patterns: "Street 123, 12345 City" or "Street 123, 12345 City, Country"
UPDATE public.users
SET 
  postal_code = CASE
    -- Pattern: digits at start or after comma/space (4-5 digits)
    WHEN address ~ ',\s*(\d{4,5})\s+' THEN regexp_replace(address, '.*,\s*(\d{4,5})\s+.*', '\1')
    WHEN address ~ '\s(\d{4,5})\s' THEN regexp_replace(address, '.*\s(\d{4,5})\s.*', '\1')
    WHEN address ~ '^(\d{4,5})\s' THEN regexp_replace(address, '^(\d{4,5})\s.*', '\1')
    ELSE NULL
  END,
  city = CASE
    -- Pattern: text after postal code (before optional comma)
    WHEN address ~ ',\s*\d{4,5}\s+([^,]+)' THEN regexp_replace(address, '.*,\s*\d{4,5}\s+([^,]+).*', '\1')
    WHEN address ~ '\d{4,5}\s+([^,]+)' THEN regexp_replace(address, '.*\d{4,5}\s+([^,]+).*', '\1')
    -- If no pattern matches, use full address as city
    ELSE address
  END
WHERE address IS NOT NULL AND address != '';

-- Clean up extracted values (trim whitespace)
UPDATE public.users
SET 
  postal_code = TRIM(postal_code),
  city = TRIM(city)
WHERE postal_code IS NOT NULL OR city IS NOT NULL;

-- 4. Update handle_new_user() trigger function to include postal_code and city
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, title, phone, address, postal_code, city, role, member_id, balance, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'title', 'Herr'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    NULL,
    0,
    'PENDING'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- Migration Complete
-- ============================================

