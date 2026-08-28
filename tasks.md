# Tasks - Current Sprint

_Last updated: 2026-08-29_

---

## 🎯 What's next (in order)

| # | Task | Status | Do with assistant? |
|---|------|--------|-------------------|
| 1 | **E2** — Manual `send-reminders` test | ⬜ | 🤝 paste JSON response |
| 2 | **E3** — Wait for reminder hour or check `cron.job_run_details` | ⬜ | 🤝 if no email |
| 3 | **F** — Git commit + push → Vercel | ⬜ | when ready |
| 4 | Optional — remove `GOOGLE_*` from Edge Function secrets | ⬜ | Auth → Google is the right place |

---

## E2 — Manual reminder test (do this next)

**Why:** Test email works, but `send-reminders` has extra filters (hour, events, `email_reminders_enabled`).

1. App → **Settings** → turn **Email reminders ON**
2. Set **timezone** (e.g. `Europe/Helsinki`) and **reminder time** = current hour
3. Check **1 day before** in reminder days
4. Create event **tomorrow** with **Reminder ON**
5. SQL (optional):
   ```sql
   UPDATE user_notification_preferences
   SET last_reminder_sent = NULL
   WHERE user_id = 'YOUR_USER_ID';
   ```
6. Supabase → Edge Functions → `send-reminders` → Invoke `{}`
7. Expected: `{ "success": true, "emails_sent": 1 }`

---

## F — Git push (when E2 passes)

```bash
git add .
git commit -m "Add Supabase reminder backend, env setup, and MVP fixes"
git push
```

Redeploy functions after code changes:

```bash
supabase functions deploy send-test-reminder-email --use-api
supabase functions deploy send-reminders --use-api
```

---

## ✅ Phase 6: Email Reminders — COMPLETE

| Step | Status | Notes |
|------|--------|-------|
| Migration 001 — `user_notification_preferences` table | ✅ | |
| Migration 002 — hourly cron `send-hourly-reminders` | ✅ | jobid 5, `0 * * * *`, active |
| Secrets — `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, `APP_URL` | ✅ | Re-set after empty `.env` sync |
| Deploy `send-test-reminder-email` | ✅ | `--use-api` + CORS fix |
| Deploy `send-reminders` | ✅ | `--use-api` |
| Test email from Settings | ✅ | Works from browser (localhost + prod) |
| Supabase CLI + `.env` setup | ✅ | Never `secrets set` with empty `RESEND_API_KEY` |

### Fixes applied (2026-08-29)

- Re-set `RESEND_API_KEY` in Dashboard (was wiped by `supabase secrets set --env-file .env`)
- Added CORS/OPTIONS handling to `send-test-reminder-email` (browser preflight)
- `REMINDER_FROM_EMAIL` = `My Calendar <onboarding@resend.dev>` ✅

<details>
<summary>Reference: Supabase deploy & secrets (click to expand)</summary>

### Where things live

| Thing | Stored where | Git push? |
|-------|--------------|-----------|
| Angular app | Vercel | ✅ |
| Edge Functions | Supabase CLI / Dashboard | ❌ |
| SQL migrations | SQL Editor | ❌ |
| Edge secrets | Supabase Dashboard | ❌ |
| UI settings (theme, language) | localStorage | ❌ |
| Email reminder prefs | `user_notification_preferences` | ❌ |

### Deploy (macOS — use `--use-api`)

```bash
supabase functions deploy send-test-reminder-email --use-api
supabase functions deploy send-reminders --use-api
```

### Secrets (Edge Functions only)

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | `re_...` from Resend |
| `REMINDER_FROM_EMAIL` | `My Calendar <onboarding@resend.dev>` |
| `APP_URL` | Vercel URL (optional) |

⚠️ Do **not** run `supabase secrets set --env-file .env` when `RESEND_API_KEY` is empty.

### Cron schedule

`0 * * * *` = check every hour; each user gets **at most one email per day** at their chosen hour/timezone.

See [supabase/README.md](supabase/README.md).

</details>

---

## ✅ MVP frontend — COMPLETE (in repo, not all pushed)

- Month-only calendar, locale wiring, elderly UX
- Email reminder UI in Settings
- Bug fixes (export, import, logout, password reset, i18n)
- `supabase/functions/` + migrations in repo

---

## 🔮 Future

- Contacts & Occasions Supabase sync (routes disabled)
- PWA / push notifications
- Unit/E2E tests
- CSV/ICS export
- Remove `GOOGLE_*` from Edge secrets (use Auth → Google only)

---

## Quick reference

| Resource | URL / command |
|----------|---------------|
| Supabase Dashboard | https://supabase.com/dashboard/project/rntnwarjiejeqfrsyzvr |
| Production app | https://my-calendar-frontend-mvp.vercel.app |
| `npm start` | Local dev |
| `npm run lint` | Lint |
