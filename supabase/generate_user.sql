-- ============================================
-- GENERATE USER WITH EMAIL, PASSWORD, AND ALL DATA
-- ============================================
-- This script creates a complete user in both auth.users and public.users tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: SET USER PARAMETERS (MODIFY THESE VALUES)
-- ============================================
DO $$
DECLARE
  -- User credentials
  p_email text := 'user@example.com';
  p_password text := 'SecurePassword123!';
  
  -- User profile data
  p_name text := 'John Doe';
  p_title text := 'Herr';  -- Options: 'Herr', 'Frau', 'Dr.', etc.
  p_phone text := '+43 123 456789';
  p_address text := 'Musterstraße 123, 1010 Wien';
  p_member_id integer := 1001;  -- Unique member ID (or NULL if not assigned yet)
  
  -- User settings
  p_role text := 'USER';  -- Options: 'USER', 'ADMIN'
  p_balance numeric := 0.00;
  p_status text := 'APPROVED';  -- Options: 'PENDING', 'APPROVED', 'REJECTED'
  p_inactive boolean := false;
  p_image_url text := NULL;  -- URL to user's profile image (optional)
  
  -- Generated values
  v_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- ============================================
  -- STEP 2: GENERATE USER ID
  -- ============================================
  v_user_id := gen_random_uuid();
  
  -- ============================================
  -- STEP 3: ENCRYPT PASSWORD
  -- ============================================
  -- Supabase uses bcrypt for password hashing
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- ============================================
  -- STEP 4: CREATE AUTH USER (auth.users table)
  -- ============================================
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',  -- instance_id
    v_user_id,                                -- id
    'authenticated',                          -- aud
    'authenticated',                          -- role
    p_email,                                  -- email
    v_encrypted_password,                     -- encrypted_password
    now(),                                    -- email_confirmed_at (auto-confirm)
    NULL,                                     -- invited_at
    '',                                       -- confirmation_token
    NULL,                                     -- confirmation_sent_at
    '',                                       -- recovery_token
    NULL,                                     -- recovery_sent_at
    '',                                       -- email_change_token_new
    '',                                       -- email_change
    NULL,                                     -- email_change_sent_at
    NULL,                                     -- last_sign_in_at
    '{"provider":"email","providers":["email"]}',  -- raw_app_meta_data
    jsonb_build_object(                       -- raw_user_meta_data
      'name', p_name,
      'title', p_title,
      'phone', p_phone,
      'address', p_address,
      'role', p_role
    ),
    false,                                    -- is_super_admin
    now(),                                    -- created_at
    now(),                                    -- updated_at
    NULL,                                     -- phone
    NULL,                                     -- phone_confirmed_at
    '',                                       -- phone_change
    '',                                       -- phone_change_token
    NULL,                                     -- phone_change_sent_at
    '',                                       -- email_change_token_current
    0,                                        -- email_change_confirm_status
    NULL,                                     -- banned_until
    '',                                       -- reauthentication_token
    NULL,                                     -- reauthentication_sent_at
    false,                                    -- is_sso_user
    NULL                                      -- deleted_at
  );
  
  -- ============================================
  -- STEP 5: CREATE PUBLIC USER PROFILE (public.users table)
  -- ============================================
  -- Note: The trigger handle_new_user() will also create this, but we'll do it manually
  -- to have full control over all fields including member_id, balance, status, etc.
  INSERT INTO public.users (
    id,
    member_id,
    email,
    name,
    title,
    address,
    phone,
    balance,
    role,
    image_url,
    inactive,
    status,
    created_at
  ) VALUES (
    v_user_id,        -- id (references auth.users)
    p_member_id,      -- member_id (unique integer)
    p_email,          -- email (unique)
    p_name,           -- name
    p_title,          -- title (required: 'Herr', 'Frau', etc.)
    p_address,        -- address
    p_phone,          -- phone
    p_balance,        -- balance (default: 0)
    p_role,           -- role (default: 'USER', options: 'USER', 'ADMIN')
    p_image_url,      -- image_url (optional)
    p_inactive,       -- inactive (default: false)
    p_status,         -- status (default: 'PENDING', options: 'PENDING', 'APPROVED', 'REJECTED')
    now()             -- created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    member_id = EXCLUDED.member_id,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    balance = EXCLUDED.balance,
    role = EXCLUDED.role,
    image_url = EXCLUDED.image_url,
    inactive = EXCLUDED.inactive,
    status = EXCLUDED.status;
  
  -- ============================================
  -- STEP 6: OUTPUT SUCCESS MESSAGE
  -- ============================================
  RAISE NOTICE 'User created successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', p_email;
  RAISE NOTICE 'Name: %', p_name;
  RAISE NOTICE 'Member ID: %', p_member_id;
  RAISE NOTICE 'Role: %', p_role;
  RAISE NOTICE 'Status: %', p_status;
  
END $$;

-- ============================================
-- VERIFICATION: Check the created user
-- ============================================
-- Uncomment the following to verify the user was created:
-- SELECT 
--   u.id,
--   u.email,
--   u.name,
--   u.member_id,
--   u.role,
--   u.status,
--   u.balance,
--   u.title,
--   u.phone,
--   u.address,
--   u.inactive,
--   u.created_at
-- FROM public.users u
-- WHERE u.email = 'user@example.com';

-- ============================================
-- NOTES:
-- ============================================
-- 1. Modify the variables in STEP 1 to customize the user
-- 2. The password will be hashed using bcrypt
-- 3. Email is automatically confirmed (email_confirmed_at is set)
-- 4. The user can immediately log in with the provided email and password
-- 5. If a user with the same email already exists, the script will fail
--    (you may need to delete the existing user first)
-- 6. member_id must be unique - if you get a conflict, use a different number
-- 7. Status options: 'PENDING' (needs approval), 'APPROVED' (can login), 'REJECTED' (blocked)
-- 8. Role options: 'USER' (regular user), 'ADMIN' (administrator)
-- 9. Title options: 'Herr', 'Frau', 'Dr.', 'Prof.', etc.
-- ============================================

