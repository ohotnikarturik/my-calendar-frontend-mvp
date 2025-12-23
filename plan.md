# My Calendar - Project Plan

_MVP personal calendar app for managing important dates with reminders_

## Current Status: Phase 3.5 Complete ✅

**App is functional** with cloud-only Supabase storage, authentication, and optimistic updates for better UX.

---

## Completed Phases

### ✅ Phase 1: Core Calendar MVP

- FullCalendar integration with month/week/day views
- Event CRUD (create, read, update, delete)
- Event modal with date/time pickers
- Responsive Material Design UI

### ✅ Phase 2: Contacts & Occasions

- Contacts management (name, birthday, notes)
- Occasions system (linked to contacts or standalone)
- Reminder system (upcoming events view)
- Date utilities for birthday calculations

### ✅ Phase 3: Supabase Integration

- Email/password and Google OAuth authentication (UI complete)
- Cloud sync with PostgreSQL backend (service complete)
- Automatic background sync (debounced, periodic, on-reconnect)
- Offline grace period for token expiration
- Auth guards on all protected routes
- Settings page with sync preferences
- Local-first architecture (IndexedDB + Supabase sync)

### ✅ Phase 3.5: Architecture Simplification

- Removed IndexedDB and Dexie dependency (~1000 lines)
- Simplified to cloud-only Supabase architecture
- Direct CRUD operations with optimistic UI updates
- Removed StorageService and SyncService
- Refactored all data services to use SupabaseService directly
- Maintained good UX with optimistic updates and error rollback

**Finalization Steps (in progress):**

- [ ] Run database migrations in Supabase SQL Editor
- [ ] Configure Google OAuth in Supabase + Google Cloud Console
- [ ] Test end-to-end auth and sync flows
- [ ] Update production environment credentials

---

## Remaining Work

### Phase 4: Polish & Accessibility

**Goal**: Production-ready UX with accessibility compliance

Tasks:

- [ ] Add loading spinners during async operations
- [ ] Implement error toast notifications (Material Snackbar)
- [ ] Add keyboard navigation (Tab, Enter, Escape)
- [ ] Add ARIA labels to interactive elements
- [ ] Implement skip links for screen readers
- [ ] Add focus indicators for keyboard users
- [ ] Test with VoiceOver/screen readers
- [ ] Add empty state illustrations
- [ ] Responsive testing on mobile devices

### Phase 5: PWA & Notifications

**Goal**: Installable app with push reminders

Tasks:

- [ ] Add `@angular/pwa` package
- [ ] Configure service worker caching
- [ ] Add install prompt UI
- [ ] Implement push notifications (FCM)
- [ ] Background sync for offline changes
- [ ] App icons and splash screens

### Phase 6: AI Features (Optional)

**Goal**: Smart suggestions and natural language input

Tasks:

- [ ] Natural language event parsing ("Birthday party next Friday at 3pm")
- [ ] Smart reminder suggestions based on event type
- [ ] Gift/activity suggestions for occasions

---

## Quick Reference

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm start`     | Start dev server (localhost:4200) |
| `npm test`      | Run unit tests                    |
| `npm run lint`  | Run ESLint                        |
| `npm run build` | Production build                  |

### Dev Mode Toggle

In `src/app/services/supabase.service.ts`:

```typescript
private readonly DEV_MODE_BYPASS_AUTH = true;  // Set false for production
```

### Supabase Setup Required

1. Create project at supabase.com
2. Copy URL and anon key to `src/environments/environment.ts`
3. Run SQL migrations (see AGENTS.md)
4. Set `DEV_MODE_BYPASS_AUTH = false`
