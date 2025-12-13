# Send Balance Emails Edge Function

This Supabase Edge Function sends automatic balance reminder emails to users with negative balances.

## Environment Variables

Set these in Supabase Dashboard > Edge Functions > Settings:

- `RESEND_API_KEY` - Your Resend API key
- `EMAIL_FROM` - Sender email address (e.g., "noreply@td-fund.com")
- `SUPABASE_URL` - Your Supabase project URL (automatically set)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access (automatically set)

## Deployment

```bash
supabase functions deploy send-balance-emails
```

## Usage

The function is called automatically by the cron job, but can also be called manually:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-balance-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

