-- ============================================
-- UPDATE: Create a case and charge all non-admin users (including inactive users, exclude only admins)
-- ============================================
-- Run this script to update the create_case function

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

  -- 2. Check if there are any non-admin users (include both active and inactive users, exclude only admins)
  select count(*) into user_count 
  from public.users 
  where (role != 'ADMIN' or role is null);
  
  -- 3. If non-admin users exist, create transactions and update balances
  if user_count > 0 then
    -- Insert CASE_FEE transaction for ALL non-admin users (including inactive users, exclude only admins)
    insert into public.transactions (user_id, case_id, type, amount, description)
    select 
      id, 
      new_case_id, 
      'CASE_FEE', 
      -case_fee, 
      'Case Gebühr - ' || case_title
    from public.users
    where (role != 'ADMIN' or role is null);

    -- Update balance for ALL non-admin users who were charged (including inactive users)
    update public.users
    set balance = balance - case_fee
    where id in (
      select user_id 
      from public.transactions 
      where case_id = new_case_id
    )
    and (role != 'ADMIN' or role is null);
  end if;
  
  -- Return the new case ID
  return new_case_id;
end;
$$ language plpgsql security definer set search_path = public;

