-- ============================================
-- SQL Snippet: Reset All User Balances to 0
-- ============================================
-- This will set the balance column to 0 for all users in the users table

UPDATE public.users
SET balance = 0;

-- Optional: If you want to see how many users were affected, run this first:
-- SELECT COUNT(*) FROM public.users;

-- Optional: If you want to verify the update, run this after:
-- SELECT id, email, name, balance FROM public.users ORDER BY balance DESC;

