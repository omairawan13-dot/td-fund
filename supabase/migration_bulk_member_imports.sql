-- ============================================
-- MIGRATION: Bulk Member Imports Table
-- Run this script in Supabase SQL Editor
-- ============================================

-- Create bulk_member_imports table
create table if not exists public.bulk_member_imports (
  id uuid default gen_random_uuid() primary key,
  s_number text,
  no text,
  name text not null,
  address text,
  postal_code text,
  city text,
  mobile_phone text,
  email text,
  membership_date text,
  photo_url text,
  status text,
  gender text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null
);

-- Add indexes for lookup
create index if not exists idx_bulk_member_imports_email on public.bulk_member_imports(email);
create index if not exists idx_bulk_member_imports_created_at on public.bulk_member_imports(created_at);

-- Disable RLS (Row Level Security) for admin access
alter table public.bulk_member_imports disable row level security;

-- Grant permissions
grant all on public.bulk_member_imports to anon, authenticated;

