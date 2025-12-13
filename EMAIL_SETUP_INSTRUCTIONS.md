# Email Notification System Setup Instructions

## Overview
The email notification system has been implemented to automatically send reminder emails to users with negative balances and allow manual email sending from the admin interface.

## Setup Steps

### 1. Install Dependencies
```bash
pnpm install
```

This will install the `resend` package that was added to `package.json`.

### 2. Environment Variables
Add the following to your `.env.local` file:

```env
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@td-fund.com
```

**To get a Resend API key:**
1. Sign up at https://resend.com
2. Create an API key in the dashboard
3. Verify your domain or use the test domain for development
4. Copy the API key to your `.env.local`

### 3. Database Schema Updates

Run the following SQL scripts in your Supabase SQL Editor:

#### a) Main Schema Updates (`supabase/schema.sql`)
The schema has been updated with:
- `email_notifications` table to track sent emails
- Email tracking columns in `users` table (`last_30_day_email_sent`, `last_90_day_email_sent`, `last_manual_email_sent`)
- `get_users_needing_balance_emails()` RPC function

Run the entire `supabase/schema.sql` file or just the new sections.

#### b) Cron Job Setup (`supabase/setup_email_cron.sql`)
To set up automatic daily emails:

1. Replace `YOUR_PROJECT` with your Supabase project reference
2. Replace `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Supabase Dashboard > Settings > API)
3. Run the script in Supabase SQL Editor

**Alternative:** Use Supabase Dashboard to set up the cron job:
- Go to Database > Extensions > pg_cron
- Create a scheduled job that calls your Edge Function URL

### 4. Deploy Edge Function

Deploy the Supabase Edge Function:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-balance-emails
```

**Set Edge Function Secrets:**
In Supabase Dashboard > Edge Functions > Settings, add:
- `RESEND_API_KEY` - Your Resend API key
- `EMAIL_FROM` - Sender email address

### 5. Test the System

#### Manual Email Test
1. Go to Admin > Members > Negative Balance
2. Click "Erinnerung senden" on any user with negative balance
3. Check that the email is sent and recorded in the database

#### Automatic Email Test
1. Manually trigger the Edge Function:
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-balance-emails \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
2. Check the `email_notifications` table to see sent emails

## Email Types

### 1. 30-Day Warning
- Sent automatically when a user has been negative for 30+ days
- Warns that they will be marked inactive after 90 days
- Only sent once per 24 hours per user

### 2. 90-Day Warning
- Sent automatically when a user has been negative for 90+ days
- Final warning before being marked inactive
- Only sent once per 24 hours per user

### 3. Manual Reminder
- Sent by admin clicking "Erinnerung senden" button
- Can be sent at any time
- Includes user's current balance and days in negative

## Database Tables

### `email_notifications`
Tracks all sent emails:
- `id` - UUID primary key
- `user_id` - Reference to users table
- `type` - '30_DAY_WARNING', '90_DAY_INACTIVE', or 'MANUAL_REMINDER'
- `sent_at` - Timestamp when email was sent
- `email_subject` - Email subject line
- `email_body` - Email body (optional)
- `status` - 'sent' or 'failed'

### `users` table additions
- `last_30_day_email_sent` - Timestamp of last 30-day warning
- `last_90_day_email_sent` - Timestamp of last 90-day warning
- `last_manual_email_sent` - Timestamp of last manual reminder

## Troubleshooting

### Emails not sending
1. Check `RESEND_API_KEY` is set correctly
2. Verify domain is verified in Resend (or use test domain)
3. Check Edge Function logs in Supabase Dashboard
4. Verify `email_notifications` table has records with status 'failed'

### Cron job not running
1. Verify `pg_cron` extension is enabled
2. Check cron job exists: `SELECT * FROM cron.job;`
3. Check cron job logs in Supabase Dashboard
4. Verify Edge Function URL is correct in cron job

### Manual emails not working
1. Check browser console for errors
2. Verify `sendManualReminderEmail` function in `lib/api.ts`
3. Check network tab for API call failures

## Files Created/Modified

### New Files
- `lib/email.ts` - Email service with templates
- `supabase/functions/send-balance-emails/index.ts` - Edge Function
- `supabase/functions/send-balance-emails/README.md` - Edge Function docs
- `supabase/setup_email_cron.sql` - Cron job setup script
- `.env.local.example` - Environment variable template

### Modified Files
- `package.json` - Added `resend` dependency
- `supabase/schema.sql` - Added email tables and functions
- `lib/api.ts` - Added email API functions
- `app/dashboard/admin/members/page.tsx` - Updated manual email button

## Next Steps

1. Set up Resend account and get API key
2. Run database schema updates
3. Deploy Edge Function
4. Set up cron job
5. Test manual and automatic emails
6. Monitor email delivery in Resend dashboard

