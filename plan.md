# Build Plan

1. Lock choices: Supabase backend, Angular Material UI, English-only now (i18n later), OpenAI for AI, PWA later.
2. Review current implementation (Material + FullCalendar + events) and tidy routes/layout as needed.
3. Define domain models: User, Contact, Occasion (birthday/anniversary/custom), Reminder, Template (TS types).
4. Add Contacts CRUD (list/create/edit/delete) with Material components.
5. Add Occasions CRUD linked to Contacts; support yearly recurrence and optional year-less birthdays.
6. Extend Calendar to render occasions (recurring) and manual events; keep drag/drop/edit.
7. Add Upcoming view (next 30/90 days) and basic search/filter by name/tag/type.
8. Implement local persistence (IndexedDB via idb/Dexie) for offline-first data.
9. Set up Supabase: schema (users, contacts, occasions, reminders, templates), RLS policies, and seed.
10. Integrate Supabase Auth (email + Google); persist session and guard routes.
11. Implement sync layer: IndexedDB ↔ Supabase with conflict rules and optimistic updates.
12. Add Settings: timezone, reminder lead times, tones, and data export/import (JSON backup).
13. AI endpoint (serverless) that calls OpenAI to generate congratulations and gift ideas; stream to UI.
14. Wire AI in UI: quick-generate buttons in event/occasion detail with copy/share.
15. Reminders MVP: in-app “Today” reminders; plan push/email scheduling for later.
16. Internationalization scaffold: add @angular/localize, extract messages; keep English default for now.
17. PWA (later): add @angular/pwa, offline caching, install prompt; plan push (FCM) in v2.
18. Optional v2: Google Calendar sync (read/write birthdays) via OAuth; import contacts.
19. Polish: onboarding, empty states, analytics/error reporting, performance passes.

20. As an idea, make option to populate calendar with some events/holidays in ukraine, finland, etc.
