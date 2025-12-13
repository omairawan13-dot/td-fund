-- ============================================
-- MIGRATION: Profile Changes and Balance Errors
-- Run this script in Supabase SQL Editor
-- ============================================

-- 1. CREATE PROFILE_CHANGES TABLE
create table if not exists public.profile_changes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  changes jsonb not null, -- Stores old/new values for each changed field
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REVERTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  review_notes text
);

-- 2. CREATE BALANCE_ERRORS TABLE
create table if not exists public.balance_errors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  reported_balance numeric not null, -- Balance when error was reported
  description text, -- User's description of the error
  status text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamp with time zone,
  resolution_notes text,
  balance_adjustment numeric -- Amount adjusted
);

-- 3. CREATE USER_NOTIFICATIONS TABLE
create table if not exists public.user_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('BALANCE_ERROR_RESOLVED', 'PROFILE_CHANGE_ACCEPTED', 'PROFILE_CHANGE_REVERTED')),
  title text not null,
  message text not null,
  related_id uuid, -- ID of related profile_change or balance_error
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. DISABLE RLS (for testing)
alter table public.profile_changes disable row level security;
alter table public.balance_errors disable row level security;
alter table public.user_notifications disable row level security;

-- 5. GRANT PERMISSIONS
grant all on public.profile_changes to anon, authenticated;
grant all on public.balance_errors to anon, authenticated;
grant all on public.user_notifications to anon, authenticated;

-- ============================================
-- Migration Complete
-- ============================================

