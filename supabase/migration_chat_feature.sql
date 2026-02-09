-- ============================================
-- CHAT FEATURE TABLES
-- Run this migration in Supabase SQL Editor
-- ============================================

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

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_chat_threads_last_message_at
  on public.chat_threads(last_message_at desc);

create index if not exists idx_chat_messages_thread_id_created_at
  on public.chat_messages(thread_id, created_at desc);

create index if not exists idx_chat_messages_sender_id
  on public.chat_messages(sender_id);

-- Keep thread timestamps in sync
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

-- Optional consistency guard:
-- only the thread owner or an admin can post in a thread.
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

-- This project currently runs without RLS
alter table public.chat_threads disable row level security;
alter table public.chat_messages disable row level security;

grant all on public.chat_threads to anon, authenticated;
grant all on public.chat_messages to anon, authenticated;
grant execute on function public.update_chat_thread_timestamp to anon, authenticated;
grant execute on function public.validate_chat_message_sender to anon, authenticated;
