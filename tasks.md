# Tasks - Current Sprint

_Active work: clean Supabase reminder setup and verify end-to-end_

---

## Where things live (important)

| Thing | Stored where | Git push updates it? |
| ----- | ------------ | -------------------- |
| Angular app | Vercel | ✅ Yes |
| Edge Functions | Supabase Dashboard / CLI deploy | ❌ No |
| SQL (tables, cron) | Supabase SQL Editor | ❌ No |
| Secrets (`RESEND_API_KEY`, etc.) | Supabase Dashboard only | ❌ No |
| UI settings (theme, language, default reminder days) | Browser `localStorage` | ❌ No (per device) |
| Email reminder settings | Supabase `user_notification_preferences` | ❌ No (until user saves in app) |
| Events | Supabase `calendar_events` | ❌ No |

**Your local repo** has the correct reminder code under `supabase/`. Supabase cloud still runs whatever was deployed earlier until you redeploy.

---

## Phase A — Supabase audit & cleanup

Goal: remove broken/old reminder infra; **keep users, events, and auth**.

### A1. What to KEEP 🤝 paste results to assistant

Run in **Supabase → SQL Editor** and share output:

```sql
-- Your data (do NOT delete these)
SELECT COUNT(*) AS events FROM calendar_events;
SELECT COUNT(*) AS users FROM auth.users;
SELECT * FROM user_notification_preferences LIMIT 5;

-- What's currently scheduled
SELECT jobid, jobname, schedule, active FROM cron.job;

-- Installed extensions
SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

**Keep:**
- All rows in `calendar_events`
- All users in Auth
- Table `user_notification_preferences` (we can reset rows, not drop the table)

### A2. What to REMOVE (safe cleanup)

**Edge Functions** (Dashboard → Edge Functions):
- Delete any old/broken reminder functions if duplicated
- You will redeploy fresh from repo in Phase D

**Cron jobs** — run in SQL Editor:

```sql
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN ('send-daily-reminders', 'send-hourly-reminders');
```

Verify: `SELECT * FROM cron.job;` should show **no** reminder jobs.

**Do NOT delete:**
- Auth users
- `calendar_events` table or data
- `RESEND_API_KEY` secret (if test email already worked)
- Project API keys in Settings → API

### A3. Settings — are they correct?

Two separate settings systems (this is intentional for MVP):

| Settings | Where | Used for |
| -------- | ----- | -------- |
| Theme, language, calendar week start, default reminder days for **new events** | `localStorage` via Settings page | Frontend only |
| Email reminders on/off, reminder days, reminder **time**, timezone for **emails** | `user_notification_preferences` in Supabase | Edge Function `send-reminders` |

After cleanup, open the app → **Settings** and confirm:
- [ ] Email reminders toggle works (saves to Supabase)
- [ ] Timezone matches yours (e.g. `Europe/Helsinki`)
- [ ] Reminder time set (e.g. 9:00 AM)
- [ ] Reminder days checked (e.g. 1 day, 7 days)

Optional reset for testing (SQL Editor):

```sql
UPDATE user_notification_preferences
SET last_reminder_sent = NULL,
    email_reminders_enabled = true
WHERE user_id = 'YOUR_USER_ID';
```

---

## Phase B — Secrets (what each key is)

Set in **Supabase → Project Settings → Edge Functions → Secrets**.

| Secret | Required? | What it is | What to do |
| ------ | --------- | ---------- | ---------- |
| `RESEND_API_KEY` | ✅ Yes | API key from [resend.com](https://resend.com) | **Keep** if test email worked. Create new only if compromised. |
| `REMINDER_FROM_EMAIL` | ✅ Yes | Sender address Resend is allowed to send from, e.g. `My Calendar <onboarding@resend.dev>` | Must match a verified sender/domain in Resend. Test email used this. |
| `APP_URL` | Optional | Link in reminder emails | `https://my-calendar-frontend-mvp.vercel.app` — function has this as default. |

**Auto-injected by Supabase (do not add manually):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

🤝 **Checkpoint with assistant:** After cleanup, confirm in Dashboard that `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` still exist. Tell me the `REMINDER_FROM_EMAIL` value format (not the API key).

---

## Phase C — Database migrations

Run in **SQL Editor** in order. These files are in your repo — they do **not** run automatically on git push.

### C1. Preferences table

File: `supabase/migrations/001_user_notification_preferences.sql`

- Safe to re-run (`CREATE TABLE IF NOT EXISTS`)
- Creates/ensures `user_notification_preferences` + RLS policies

🤝 **Checkpoint:** Confirm table exists in Table Editor.

### C2. Cron job (after functions deployed in Phase D)

File: `supabase/migrations/002_cron_send_reminders.sql`

- Enables `pg_cron` + `pg_net`
- Removes old jobs, creates `send-hourly-reminders` (every hour at `:00`)
- Already has your project ref and anon key filled in

⚠️ Run **after** Phase D (functions must exist first).

🤝 **Checkpoint:** Paste `SELECT * FROM cron.job;` result.

---

## Phase D — Deploy Edge Functions from repo

Local code fixes (`repeat_annually`, types) are only live after deploy.

### Option 1 — CLI (recommended)

```bash
npm install -g supabase   # if not installed
supabase login
cd /path/to/my-calendar-frontend-mvp
supabase link --project-ref rntnwarjiejeqfrsyzvr
supabase functions deploy send-test-reminder-email
supabase functions deploy send-reminders
```

### Option 2 — Dashboard

Copy code from:
- `supabase/functions/send-test-reminder-email/index.ts`
- `supabase/functions/send-reminders/index.ts`

🤝 **Checkpoint:** Invoke `send-test-reminder-email` from Dashboard with `{ "user_id": "YOUR_USER_ID" }`. Confirm email arrives.

---

## Phase E — End-to-end test (interactive)

Do these in order. 🤝 Tell assistant the JSON response at each step if something fails.

### E1. Test email (already works for you)

App → Settings → **Send Test Email** → check inbox.

### E2. Manual `send-reminders` test

**Setup in app:**
1. Email reminders **ON**
2. Reminder time = **current hour** in your timezone
3. Reminder days includes **1 day before**
4. Create event **tomorrow** with **Reminder ON** and 1 day before

**Reset send lock (SQL):**
```sql
UPDATE user_notification_preferences SET last_reminder_sent = NULL WHERE user_id = 'YOUR_USER_ID';
```

**Invoke:** Dashboard → `send-reminders` → body `{}`

**Expected:** `{ "success": true, "emails_sent": 1 }`

**If `emails_sent: 0`:** function ran but filters didn't match — wrong hour, no matching event, or reminder disabled on event. Ask assistant with your settings + event date.

### E3. Cron test

Wait until next hour (`:00`) or check:

```sql
SELECT status, return_message, start_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 5;
```

At your configured reminder hour, you should receive email without manual invoke.

---

## Phase F — Frontend deploy (when Supabase is verified)

```bash
git add .
git commit -m "..."
git push
```

Vercel redeploys Angular only. Reminder backend still needs Phase C–D separately.

---

## Progress tracker

| Step | Status | Notes |
| ---- | ------ | ----- |
| A1 Audit queries | ⬜ | Paste results to assistant |
| A2 Remove old cron + duplicate functions | ⬜ | |
| A3 Verify Settings in app | ⬜ | |
| B Secrets confirmed | ⬜ | Keep existing Resend keys |
| C1 Migration 001 | ⬜ | |
| D Deploy both functions | ⬜ | |
| C2 Migration 002 (cron) | ⬜ | After D |
| E1 Test email | ✅ | Already works |
| E2 Manual send-reminders | ⬜ | |
| E3 Cron verified | ⬜ | |
| F Git push frontend | ⬜ | |

---

## ✅ Already complete (frontend / repo)

- Month-only calendar, locale wiring, elderly UX
- Email reminder UI in Settings
- Edge Function code in `supabase/functions/`
- Migrations in `supabase/migrations/`
- Test email integration in app

---

## 🔮 Future (after reminders work)

- Contacts & Occasions Supabase sync (routes disabled)
- PWA / push notifications
- Unit/E2E tests
- CSV/ICS export

---

## Quick reference

| Resource | URL / command |
| -------- | ------------- |
| Supabase Dashboard | https://supabase.com/dashboard |
| Production app | https://my-calendar-frontend-mvp.vercel.app |
| Setup details | [supabase/README.md](supabase/README.md) |
| `npm start` | Local dev |
| `npm run lint` | Lint |
