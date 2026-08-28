# My Calendar - Project Plan

_MVP personal calendar app for managing important dates with reminders_

## Current Status: Phase 6 Complete (pending Supabase deploy verification)

**Production URL**: https://my-calendar-frontend-mvp.vercel.app

The app is deployed with full authentication, CRUD operations, internationalization, simplified month-only calendar, and version-controlled email reminder backend in `supabase/`.

---

## Phase Overview

| Phase | Name                        | Status      |
| ----- | --------------------------- | ----------- |
| 1     | Core Calendar MVP           | ✅ Complete |
| 2     | Contacts & Occasions        | ✅ Complete (UI only; backend deferred) |
| 3     | Supabase Integration        | ✅ Complete |
| 4     | Polish & Accessibility      | ✅ Complete |
| 5     | Production Deployment       | ✅ Complete |
| 6     | Email Reminders             | ✅ Complete (code in repo; deploy to Supabase) |
| 7     | Internationalization (i18n) | ✅ Complete |
| 8     | AI Features                 | 🔮 Future   |

---

## Recent MVP Finalization (2026)

- **Annual repeat fix:** Past birthdays/anniversaries with "repeat every year" now show on the current year's calendar
- **Month-only calendar:** Removed week/day/list views for simpler navigation
- **Locale wiring:** Dates, calendar, and relative day text follow selected language
- **Bug fixes:** Export download, import spinner, logout redirect, settings email UI, password reset page
- **Email backend in repo:** `supabase/functions/` with corrected `calendar_events` schema
- **Elderly UX:** Larger fonts, bigger calendar tap targets, simplified event modal

---

## Phase 6: Email Reminders

**Provider:** Resend via Supabase Edge Functions

**Repo files:**
- `supabase/functions/send-test-reminder-email/`
- `supabase/functions/send-reminders/`
- `supabase/migrations/` (preferences table + hourly cron)
- `supabase/README.md` (setup steps)

**Deploy:** Run migrations and `supabase functions deploy` — see `supabase/README.md`

---

## Deferred

- Contacts/Occasions Supabase sync (routes remain disabled)
- PWA / push notifications
- Unit/E2E tests
- CSV/ICS export

---

## Tech Stack

| Category   | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Angular 20 (standalone components, signals) |
| UI Library | Angular Material (Material Design 3)        |
| Calendar   | FullCalendar (month view only)              |
| Backend    | Supabase (Auth + PostgreSQL)                |
| Email      | Resend (Edge Functions)                     |
| Hosting    | Vercel                                      |

## Quick Reference

| Command         | Description                 |
| --------------- | --------------------------- |
| `npm start`     | Dev server (localhost:4200) |
| `npm run lint`  | Run ESLint                  |
| `npm run build` | Production build            |
