-- ============================================
-- MIGRATION: Add Title and Status to Users
-- Run this script in Supabase SQL Editor
-- ============================================

-- 1. Add title column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.users ADD COLUMN title text NOT NULL DEFAULT 'Herr';
  END IF;
END $$;

-- 2. Add status column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN status text NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
    
    -- Set existing users to APPROVED if they don't have a status
    UPDATE public.users SET status = 'APPROVED' WHERE status IS NULL;
  END IF;
END $$;

-- 3. Update handle_new_user() trigger function to include title, phone, and address
-- First drop the trigger, then the function, then recreate both
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, title, phone, address, role, member_id, balance, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'title', 'Herr'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
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

-- 4. Add INITIAL_FEE transaction type
DO $$ 
BEGIN
  -- Drop the existing check constraint
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  
  -- Add new check constraint with INITIAL_FEE
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('DEPOSIT', 'CASE_FEE', 'INITIAL_FEE'));
END $$;

-- ============================================
-- Migration Complete
-- ============================================

