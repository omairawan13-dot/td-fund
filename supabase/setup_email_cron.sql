-- ============================================
-- SETUP CRON JOB FOR AUTOMATIC EMAIL SENDING
-- ============================================
-- Run this script in Supabase SQL Editor to set up the daily email cron job

-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- Schedule daily email check at 9:00 AM UTC
-- IMPORTANT: Replace YOUR_PROJECT and YOUR_SERVICE_ROLE_KEY with your actual values
-- You can find your service role key in Supabase Dashboard > Settings > API

SELECT cron.schedule(
  'send-balance-emails-daily',
  '0 9 * * *', -- 9:00 AM UTC daily (adjust timezone as needed)
  $$
  SELECT net.http_post(
    url := 'https://zotifjywwbpglvslnkfq.supabase.co/functions/v1/send-balance-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdGlmanl3d2JwZ2x2c2xua2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwNzY5MiwiZXhwIjoyMDgwMTgzNjkyfQ.kBE9cSOibtdTy_RA8MHdGUjjr5bOmicY105ovHNx18k'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('send-balance-emails-daily');

-- Note: If net extension is not available, you may need to:
-- 1. Enable the net extension: CREATE EXTENSION IF NOT EXISTS net;
-- 2. Or use Supabase Dashboard to set up the cron job manually
-- 3. Or use an external cron service (like cron-job.org) to call your Edge Function

