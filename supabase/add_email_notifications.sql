-- ============================================
-- EMAIL NOTIFICATION SYSTEM - DATABASE SETUP
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This adds all email-related tables, columns, and functions
-- ============================================

-- 1. CREATE EMAIL_NOTIFICATIONS TABLE
-- ============================================
create table if not exists public.email_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('30_DAY_WARNING', '90_DAY_INACTIVE', 'MANUAL_REMINDER')),
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email_subject text,
  email_body text,
  status text not null check (status in ('sent', 'failed')) default 'sent'
);

-- 2. ADD EMAIL TRACKING COLUMNS TO USERS TABLE
-- ============================================
do $$
begin
  -- Add last_30_day_email_sent
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'last_30_day_email_sent'
  ) then
    alter table public.users add column last_30_day_email_sent timestamp with time zone;
  end if;
  
  -- Add last_90_day_email_sent
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'last_90_day_email_sent'
  ) then
    alter table public.users add column last_90_day_email_sent timestamp with time zone;
  end if;
  
  -- Add last_manual_email_sent
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'last_manual_email_sent'
  ) then
    alter table public.users add column last_manual_email_sent timestamp with time zone;
  end if;
end $$;

-- 3. DISABLE RLS FOR EMAIL_NOTIFICATIONS (if RLS is disabled for other tables)
-- ============================================
alter table public.email_notifications disable row level security;

-- 4. GRANT PERMISSIONS
-- ============================================
grant all on public.email_notifications to anon, authenticated;

-- 5. CREATE FUNCTION: Get users needing balance emails
-- ============================================
-- This function identifies users who need 30-day or 90-day warning emails
-- The days_in_negative will be calculated by the calling code (Edge Function/API)
-- This function just identifies which users need emails based on their last email sent dates
drop function if exists public.get_users_needing_balance_emails();

create or replace function public.get_users_needing_balance_emails()
returns table (
  user_id uuid,
  email text,
  name text,
  days_in_negative integer,
  needs_30_day_email boolean,
  needs_90_day_email boolean
) as $$
begin
  return query
  -- Get all users with negative balance who are active and not admins
  select 
    u.id as user_id,
    u.email,
    u.name,
    -- Days will be calculated by the calling function (Edge Function/API)
    -- We return 0 here as placeholder
    0 as days_in_negative,
    -- Needs 30-day email if: (never sent OR sent more than 24 hours ago)
    (u.last_30_day_email_sent is null 
     or u.last_30_day_email_sent < now() - interval '24 hours') as needs_30_day_email,
    -- Needs 90-day email if: not inactive AND (never sent OR sent more than 24 hours ago)
    ((u.inactive = false or u.inactive is null)
     and (u.last_90_day_email_sent is null 
          or u.last_90_day_email_sent < now() - interval '24 hours')) as needs_90_day_email
  from public.users u
  where u.balance < 0
    and (u.inactive = false or u.inactive is null)
    and (u.role != 'ADMIN' or u.role is null);
end;
$$ language plpgsql security definer set search_path = public;

-- 6. GRANT EXECUTE PERMISSION ON FUNCTION
-- ============================================
grant execute on function public.get_users_needing_balance_emails to anon, authenticated;

-- ============================================
-- DONE! 
-- ============================================
-- You can now:
-- 1. Test the function: SELECT * FROM public.get_users_needing_balance_emails();
-- 2. Check the email_notifications table structure
-- 3. Set up the cron job using supabase/setup_email_cron.sql
-- ============================================

