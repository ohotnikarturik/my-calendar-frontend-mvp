# My Calendar - Project Plan

_MVP personal calendar app for managing important dates with reminders_

## Current Status: Phase 6 In Progress 🚧

**Production URL**: https://my-calendar-frontend-mvp.vercel.app

The app is deployed with full authentication, CRUD operations, and internationalization. Currently implementing email reminders via Supabase Edge Functions.

---

## Phase Overview

| Phase | Name                        | Status      |
| ----- | --------------------------- | ----------- |
| 1     | Core Calendar MVP           | ✅ Complete |
| 2     | Contacts & Occasions        | ✅ Complete |
| 3     | Supabase Integration        | ✅ Complete |
| 4     | Polish & Accessibility      | ✅ Complete |
| 5     | Production Deployment       | ✅ Complete |
| 6     | Email Reminders             | 🚧 Active   |
| 7     | Internationalization (i18n) | ✅ Complete |
| 8     | AI Features                 | 🔮 Future   |

---

## ✅ Completed Phases

### Phase 1: Core Calendar MVP

- FullCalendar integration with month/week/day views
- Event CRUD with modal dialogs
- Date/time pickers with Material Design
- Responsive layout

### Phase 2: Contacts & Occasions

- Contacts management (name, birthday, notes)
- Occasions system (birthdays, anniversaries)
- Upcoming events view with reminders
- Date utilities for age calculations

### Phase 3: Supabase Integration

- Email/password authentication
- Google OAuth authentication
- PostgreSQL cloud database
- Row-Level Security (RLS) policies
- Optimistic UI updates with error rollback
- Auth guards on protected routes

### Phase 4: Polish & Accessibility

- Loading spinners during async operations
- Error notifications (Material Snackbar)
- Global error handler service
- ARIA labels on all interactive elements
- Keyboard navigation support
- Empty state components
- Confirmation dialogs for destructive actions
- Form validation feedback
- Responsive hamburger menu
- Dark mode support (light/dark/auto)
- Smooth CSS animations and transitions

### Phase 5: Production Deployment

- Deployed to Vercel
- Supabase production configuration
- Google OAuth in production
- All CRUD operations verified
- Mobile responsive testing complete

### Phase 7: Internationalization (i18n)

- 4 languages: English, Russian, Ukrainian, Finnish
- Signal-based TranslationService
- TranslatePipe for templates
- Language selector in Settings
- All pages and components translated

---

## 🚧 Phase 6: Email Reminders (Current)

**Goal**: Send email reminders for upcoming events via Supabase Edge Functions

### What's Done ✅

**Frontend UI** - Settings page with Email Reminders section:

- Toggle to enable/disable email reminders
- Checkboxes for reminder days (1, 3, 7, 14 days before)
- Dropdown for preferred reminder time (8 AM - 6 PM)
- Timezone selector
- "Send Test Email" button with loading state
- Full accessibility (ARIA labels)

**Services Created:**

- `NotificationPreferencesService` - Signal-based state management
- `SupabaseService.client` getter for database access

**Types Created:**

- `NotificationPreferences` interface
- `DEFAULT_NOTIFICATION_PREFERENCES` constant
- `REMINDER_TIME_OPTIONS` and `REMINDER_DAY_OPTIONS` arrays

### What's Left 🔴

See [tasks.md](tasks.md) for detailed implementation steps.

**Backend (Supabase):**

1. Create `user_notification_preferences` database table
2. Create `send-reminders` Edge Function
3. Create `send-test-reminder-email` Edge Function
4. Set up daily Cron job
5. Integrate with email provider (Resend recommended)

---

## 🔮 Future Phases

### Phase 8: AI Features (Optional)

- Natural language event parsing ("Birthday party next Friday at 3pm")
- Smart reminder suggestions based on event type
- Gift/activity suggestions for occasions

### Post-MVP: Testing

- Unit tests for services
- Component tests for modals
- E2E tests for critical flows

---

## Tech Stack

| Category   | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Angular 20 (standalone components, signals) |
| UI Library | Angular Material (Material Design 3)        |
| Calendar   | FullCalendar                                |
| Backend    | Supabase (Auth + PostgreSQL)                |
| Hosting    | Vercel                                      |
| Language   | TypeScript (strict mode)                    |

## Quick Reference

| Command         | Description                 |
| --------------- | --------------------------- |
| `npm start`     | Dev server (localhost:4200) |
| `npm test`      | Run unit tests              |
| `npm run lint`  | Run ESLint                  |
| `npm run build` | Production build            |

## Project Structure

```
src/app/
├── components/       # Reusable UI components
├── pages/            # Route-level components
├── services/         # Business logic & state
├── guards/           # Route protection
├── pipes/            # Template pipes
├── types/            # TypeScript interfaces
└── i18n/             # Translation files (en, ru, ua, fi)
```
