-- ============================================
-- COMPLETE SCHEMA FOR TD-FUND
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. CREATE USERS TABLE FIRST (other tables depend on it)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  member_id integer unique,
  email text unique,
  name text,
  title text not null,
  address text,
  phone text,
  balance numeric default 0 not null,
  role text default 'USER' not null,
  image_url text,
  inactive boolean default false not null,
  status text default 'PENDING' not null check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CREATE CASES TABLE
create table if not exists public.cases (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  fee numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE CSV_UPLOADS TABLE (track CSV file uploads)
create table if not exists public.csv_uploads (
  id uuid default gen_random_uuid() primary key,
  filename text,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_rows integer default 0,
  auto_processed_count integer default 0,
  manual_review_count integer default 0
);

-- 4. CREATE TRANSACTIONS TABLE (depends on users and cases)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  csv_upload_id uuid references public.csv_uploads(id) on delete set null,
  type text not null check (type in ('DEPOSIT', 'CASE_FEE', 'INITIAL_FEE')),
  amount numeric not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. CREATE PENDING_REVIEWS TABLE (for manual CSV review cases)
create table if not exists public.pending_reviews (
  id uuid default gen_random_uuid() primary key,
  date text,
  info text not null,
  date2 text,
  value text,
  currency text,
  timestamp text,
  extracted_member_ids integer[] default '{}',
  status text not null check (status in ('multiple_ids', 'no_id', 'no_match', 'multiple_matches')),
  assigned_user_id uuid references public.users(id) on delete set null,
  reference_section text,
  auftraggeber text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CREATE NEWS_POSTS TABLE (for news/announcements)
create table if not exists public.news_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  excerpt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null
);

-- 7. CREATE EMAIL_NOTIFICATIONS TABLE (track sent emails)
create table if not exists public.email_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('30_DAY_WARNING', '90_DAY_INACTIVE', 'MANUAL_REMINDER')),
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email_subject text,
  email_body text,
  status text not null check (status in ('sent', 'failed')) default 'sent'
);

-- 8. CREATE PROCESSED_REVIEWS_HISTORY TABLE (for tracking processed manual reviews)
create table if not exists public.processed_reviews_history (
  id uuid default gen_random_uuid() primary key,
  original_review_id uuid, -- Reference to the original pending_review (if it existed)
  date text,
  info text not null,
  date2 text,
  value text,
  currency text,
  timestamp text,
  extracted_member_ids integer[] default '{}',
  status text not null,
  assigned_user_id uuid references public.users(id) on delete set null,
  reference_section text,
  auftraggeber text,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_by uuid references auth.users(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null
);

-- 9. CREATE PROFILE_CHANGES TABLE (for tracking user profile changes)
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

-- 10. CREATE BALANCE_ERRORS TABLE (for user balance error reports)
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

-- 11. CREATE USER_NOTIFICATIONS TABLE (for showing messages to users)
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

-- 12. CREATE CHAT_THREADS TABLE (one thread per user for user<->admin contact)
create table if not exists public.chat_threads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  last_message_at timestamp with time zone,
  user_last_read_at timestamp with time zone,
  admin_last_read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. CREATE CHAT_MESSAGES TABLE
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat indexes
create index if not exists idx_chat_threads_last_message_at on public.chat_threads(last_message_at desc);
create index if not exists idx_chat_messages_thread_id_created_at on public.chat_messages(thread_id, created_at desc);
create index if not exists idx_chat_messages_sender_id on public.chat_messages(sender_id);

-- Keep chat thread timestamps in sync with new messages
create or replace function public.update_chat_thread_timestamp()
returns trigger as $$
begin
  update public.chat_threads
  set
    last_message_at = new.created_at,
    updated_at = timezone('utc'::text, now())
  where id = new.thread_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_chat_message_insert_update_thread on public.chat_messages;
create trigger on_chat_message_insert_update_thread
  after insert on public.chat_messages
  for each row execute function public.update_chat_thread_timestamp();

-- Only thread owner or admins are allowed to post
create or replace function public.validate_chat_message_sender()
returns trigger as $$
declare
  thread_user_id uuid;
  sender_role text;
begin
  select user_id into thread_user_id
  from public.chat_threads
  where id = new.thread_id;

  if thread_user_id is null then
    raise exception 'Thread does not exist';
  end if;

  select role into sender_role
  from public.users
  where id = new.sender_id;

  if sender_role is null then
    raise exception 'Sender does not exist';
  end if;

  if new.sender_id <> thread_user_id and sender_role <> 'ADMIN' then
    raise exception 'Only thread owner or admin can send messages';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_chat_message_validate_sender on public.chat_messages;
create trigger on_chat_message_validate_sender
  before insert on public.chat_messages
  for each row execute function public.validate_chat_message_sender();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Currently disabled per user request
-- Uncomment these when ready to enable RLS
-- ============================================

-- Disable RLS for now (for testing)
alter table public.users disable row level security;
alter table public.cases disable row level security;
alter table public.csv_uploads disable row level security;
alter table public.transactions disable row level security;
alter table public.pending_reviews disable row level security;
alter table public.processed_reviews_history disable row level security;
alter table public.news_posts disable row level security;
alter table public.email_notifications disable row level security;
alter table public.profile_changes disable row level security;
alter table public.balance_errors disable row level security;
alter table public.user_notifications disable row level security;
alter table public.chat_threads disable row level security;
alter table public.chat_messages disable row level security;

-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, title, phone, address, role, member_id, balance, status)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', new.email), 
    coalesce(new.raw_user_meta_data->>'title', 'Herr'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    coalesce(new.raw_user_meta_data->>'role', 'USER'),
    null,
    0,
    'PENDING'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FUNCTION: Create a case and charge all ACTIVE non-admin users (exclude inactive and admins)
-- ============================================
drop function if exists public.create_case(text, text, numeric);

create or replace function public.create_case(
  case_title text,
  case_description text,
  case_fee numeric
)
returns uuid as $$
declare
  new_case_id uuid;
  user_count integer;
begin
  -- 1. Insert into cases
  insert into public.cases (title, description, fee)
  values (case_title, case_description, case_fee)
  returning id into new_case_id;

  -- 2. Check if there are any active non-admin users (exclude inactive users and admins)
  select count(*) into user_count 
  from public.users 
  where (inactive = false or inactive is null)
    and (role != 'ADMIN' or role is null);
  
  -- 3. If active non-admin users exist, create transactions and update balances
  if user_count > 0 then
    -- Insert CASE_FEE transaction for ACTIVE non-admin users only (exclude inactive and admins)
    insert into public.transactions (user_id, case_id, type, amount, description)
    select 
      id, 
      new_case_id, 
      'CASE_FEE', 
      -case_fee, 
      'Case Gebühr - ' || case_title
    from public.users
    where (inactive = false or inactive is null)
      and (role != 'ADMIN' or role is null);

    -- Update balance for ACTIVE non-admin users who were charged (using subquery to satisfy WHERE requirement)
    update public.users
    set balance = balance - case_fee
    where id in (
      select user_id 
      from public.transactions 
      where case_id = new_case_id
    )
    and (inactive = false or inactive is null)
    and (role != 'ADMIN' or role is null);
  end if;
  
  -- Return the new case ID
  return new_case_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCTION: Process a deposit (add to balance)
-- ============================================
drop function if exists public.process_deposit(uuid, numeric, text, text);

create or replace function public.process_deposit(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_date text,
  p_csv_upload_id uuid default null
)
returns uuid as $$
declare
  new_transaction_id uuid;
  parsed_date timestamp with time zone;
begin
  -- Parse date - try ISO format first (YYYY-MM-DD), then DD.MM.YYYY, then use now()
  if p_date is null or p_date = '' then
    parsed_date := now();
  else
    begin
      -- Try ISO format (YYYY-MM-DD) - PostgreSQL native casting
      parsed_date := p_date::date;
    exception when others then
      begin
        -- Try DD.MM.YYYY format
        parsed_date := to_timestamp(p_date, 'DD.MM.YYYY');
      exception when others then
        -- If both fail, use current timestamp
        parsed_date := now();
      end;
    end;
  end if;

  -- Insert deposit transaction
  insert into public.transactions (user_id, type, amount, description, created_at, csv_upload_id)
  values (p_user_id, 'DEPOSIT', p_amount, p_description, parsed_date, p_csv_upload_id)
  returning id into new_transaction_id;

  -- Update user balance (add the deposit amount)
  update public.users
  set balance = balance + p_amount
  where id = p_user_id;

  return new_transaction_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- GRANT PERMISSIONS (important for RPC calls)
-- ============================================
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;
grant all on public.cases to anon, authenticated;
grant all on public.csv_uploads to anon, authenticated;
grant all on public.transactions to anon, authenticated;
grant all on public.pending_reviews to anon, authenticated;
grant all on public.processed_reviews_history to anon, authenticated;
grant all on public.news_posts to anon, authenticated;
grant all on public.email_notifications to anon, authenticated;
grant all on public.profile_changes to anon, authenticated;
grant all on public.balance_errors to anon, authenticated;
grant all on public.user_notifications to anon, authenticated;
grant all on public.chat_threads to anon, authenticated;
grant all on public.chat_messages to anon, authenticated;
grant execute on function public.create_case to anon, authenticated;
grant execute on function public.handle_new_user to anon, authenticated;
grant execute on function public.process_deposit to anon, authenticated;
grant execute on function public.update_chat_thread_timestamp to anon, authenticated;
grant execute on function public.validate_chat_message_sender to anon, authenticated;

-- ============================================
-- ADD INACTIVE COLUMN (if not exists)
-- ============================================
-- Run this if the column doesn't exist yet
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'inactive'
  ) then
    alter table public.users add column inactive boolean default false not null;
  end if;
end $$;

-- ============================================
-- ADD TITLE AND STATUS COLUMNS TO USERS TABLE (if not exists)
-- ============================================
do $$
begin
  -- Add title column
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'title'
  ) then
    alter table public.users add column title text not null default 'Herr';
  end if;
  
  -- Add status column
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'status'
  ) then
    alter table public.users add column status text default 'PENDING' not null check (status in ('PENDING', 'APPROVED', 'REJECTED'));
    -- Set existing users to APPROVED
    update public.users set status = 'APPROVED' where status is null or status = '';
  end if;
end $$;

-- ============================================
-- ADD EMAIL TRACKING COLUMNS TO USERS TABLE
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

-- ============================================
-- STORAGE POLICIES FOR IMAGES BUCKET
-- ============================================
-- Note: These policies assume the 'images' bucket exists and is public
-- Run these after creating the bucket in Supabase Dashboard

-- Policy: Allow authenticated users to upload files to users/ folder
create policy "Users can upload their own images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'images' 
  and (storage.foldername(name))[1] = 'users'
);

-- Policy: Allow system to upload QR codes (for email generation)
create policy "Allow QR code uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'images' 
  and (storage.foldername(name))[1] = 'qr-codes'
);

-- Policy: Allow authenticated users to read all images
create policy "Anyone can view images"
on storage.objects
for select
to authenticated
using (bucket_id = 'images');

-- Policy: Allow public read access to QR codes (for email display)
create policy "Public QR code access"
on storage.objects
for select
to public
using (bucket_id = 'images' and (storage.foldername(name))[1] = 'qr-codes');

-- Policy: Allow users to delete their own images
create policy "Users can delete their own images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'images' 
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text || '-' || '%'
);
