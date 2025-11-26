# Build Plan

## ✅ Completed (MVP Phase 1)

1. ✅ **Lock choices**: Supabase backend, Angular Material UI, English-only now (i18n later), OpenAI for AI, PWA later.
2. ✅ **Review current implementation**: Material + FullCalendar + events with routes/layout setup.
3. ✅ **Basic domain models**: CalendarEvent type with eventType, category, reminders, recurrence support.
4. ✅ **Events CRUD**: Full CRUD operations with modal editing (`EventModal` component).
5. ✅ **Calendar integration**: FullCalendar with multiple views (month, week, day, list), drag/drop, resize.
6. ✅ **Upcoming view**: Next 7/30/90 days with search/filter by category and name (`Upcoming` component).
7. ✅ **Local persistence**: IndexedDB via Dexie (`StorageService`) for offline-first data.
8. ✅ **Reminders MVP**: In-app reminders service (`RemindersService`) with "Today" notifications, reminder days before calculation.
9. ✅ **Navigation & routing**: Home, Calendar, Upcoming, About pages with Material navigation.
10. ✅ **Event features**: Recurring events (repeatAnnually), event types (birthday/anniversary/memorial/custom), categories, colors, notes.

## 🚧 Next Steps (MVP Phase 2)

11. **Define extended domain models**: User, Contact, Occasion (birthday/anniversary/custom), Reminder, Template (TS types).
12. **Add Contacts CRUD**: List/create/edit/delete contacts with Material components.
13. **Add Occasions CRUD**: Link occasions to contacts; support yearly recurrence and optional year-less birthdays.
14. **Extend Calendar**: Render occasions (recurring) alongside manual events; maintain drag/drop/edit functionality.
15. **Settings page**: Timezone, reminder lead times, tones, and data export/import (JSON backup).
16. **Code improvements**: Refactor duplicate date parsing logic, improve error handling, add loading states, enhance accessibility.

## 🔮 Future Enhancements (Phase 3+)

17. **Supabase setup**: Schema (users, contacts, occasions, reminders, templates), RLS policies, and seed data.
18. **Supabase Auth**: Email + Google authentication; persist session and guard routes.
19. **Sync layer**: IndexedDB ↔ Supabase with conflict rules and optimistic updates.
20. **AI features**: Serverless endpoint calling OpenAI to generate congratulations and gift ideas; stream to UI.
21. **AI UI integration**: Quick-generate buttons in event/occasion detail with copy/share functionality.
22. **Enhanced reminders**: Push notifications and email scheduling (beyond in-app reminders).
23. **Internationalization**: Add @angular/localize, extract messages; keep English default for now.
24. **PWA**: Add @angular/pwa, offline caching, install prompt; plan push (FCM) in v2.
25. **Google Calendar sync**: Optional v2 feature - read/write birthdays via OAuth; import contacts.
26. **Holiday calendars**: Option to populate calendar with events/holidays (Ukraine, Finland, etc.).
27. **Polish**: Onboarding flow, improved empty states, analytics/error reporting, performance optimization passes.
