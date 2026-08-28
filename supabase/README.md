# Supabase Backend Setup

Email reminders use **Resend** via Supabase Edge Functions.

## Local `.env` (optional)

Copy `.env.example` → `.env` for Supabase CLI. Valid `KEY=value` format only.

```bash
# Uploads RESEND_API_KEY, REMINDER_FROM_EMAIL, APP_URL only.
# ⚠️ Never run this if RESEND_API_KEY is empty in .env — it overwrites the cloud secret!
supabase secrets set --env-file .env
```

Expected output includes `skipping: SUPABASE_...` — that is **normal**.

Angular uses `src/environments/environment.ts` — not `.env`. Keep `SUPABASE_URL` / `SUPABASE_ANON_KEY` in sync manually.

## Required secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `REMINDER_FROM_EMAIL` | Verified sender, e.g. `My Calendar <reminders@yourdomain.com>` |
| `APP_URL` | Production app URL (default: Vercel deployment) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Deploy functions

```bash
supabase functions deploy send-test-reminder-email
supabase functions deploy send-reminders
```

## Database

Run migrations in order via SQL Editor or `supabase db push`:

1. `migrations/001_user_notification_preferences.sql`
2. `migrations/002_cron_send_reminders.sql` — update `YOUR_ANON_KEY` first

## Testing

1. **Test email:** Settings → Send Test Email (invokes `send-test-reminder-email`)
2. **Manual cron:** Supabase Dashboard → Edge Functions → invoke `send-reminders`
3. **Production:** Create an event with reminders enabled; wait for the user's configured hour/timezone

## Reminder logic

- Queries `calendar_events` (not `events`)
- Respects per-event `reminder_enabled` and `reminder_days_before`
- Also uses global `reminder_days[]` from user preferences
- Handles `repeat_annually` by projecting to current/next year occurrence
- Cron runs hourly; function filters users whose local `reminder_time` matches
