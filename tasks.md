# Tasks - Current Sprint

_Active work items for My Calendar MVP_

## ✅ Completed

### Phase 3 & 3.5: Supabase Integration & Simplification

- ✅ Created Supabase project with PostgreSQL backend
- ✅ Ran database migrations (events, contacts, occasions tables)
- ✅ Configured RLS policies for secure data access
- ✅ Implemented authentication (email/password + Google OAuth)
- ✅ Removed IndexedDB/Dexie complexity (~1000 lines)
- ✅ Refactored to cloud-only Supabase architecture
- ✅ Implemented optimistic updates for better UX
- ✅ Configured Google OAuth in production
- ✅ Tested authentication flows (signup/login/Google)
- ✅ Verified CRUD operations (events, contacts, occasions)
- ✅ Confirmed data persistence in Supabase

---

## Priority: High 🔴

### 1. Error Handling & User Feedback

**Goal**: Improve user experience with better error messages and loading states

- [x] Implement global error handler service
- [x] Add Material Snackbar for success/error notifications
- [x] Show loading spinners during async operations
- [x] Add "try again" options for failed operations
- [x] Handle network errors gracefully
- [x] Add validation feedback in forms

### 2. Disable DEV_MODE_BYPASS_AUTH

**Goal**: Remove development bypass and require real authentication

- [ ] Set `DEV_MODE_BYPASS_AUTH = false` in [supabase.service.ts](src/app/services/supabase.service.ts)
- [ ] Test that unauthenticated users are redirected to login
- [ ] Verify auth guards work on all protected routes
- [ ] Test session expiration handling

---

## Priority: Medium 🟡

### 1. UI/UX Polish

**Goal**: Make the app feel more polished and professional

- [ ] Add empty state messages/illustrations (no events, no contacts, etc.)
- [ ] Improve mobile responsiveness (test on phone)
- [ ] Add smooth transitions and animations
- [ ] Improve calendar color scheme consistency
- [ ] Add confirmation dialogs for delete actions
- [ ] Improve form validation feedback

### 2. Accessibility Improvements

- Add ARIA labels to all buttons and interactive elements
- Implement keyboard shortcuts (Escape to close modals)
- Add focus trapping in modals
- Test with VoiceOver

### 4. Loading States

- Add mat-spinner during data fetch
- Show skeleton loaders on calendar
- Disable buttons during async operations

### 5. Error Handling

- Implement global error handler
- Add user-friendly error messages
- Show retry options for failed operations

---

## Priority: Low 🟢

### 1. Advanced Features

- [ ] Recurring events (weekly, monthly, yearly)
- [ ] Event categories/tags with filtering
- [ ] Search functionality across events/contacts
- [ ] Bulk operations (delete multiple, export filtered)
- [ ] Dark mode support

### 2. Testing

- Unit tests for services
- Component tests for modals
- E2E tests for critical flows

---

## Completed Recently ✅

- [x] Removed IndexedDB/Dexie (~1000 lines of code)
- [x] Simplified to cloud-only Supabase architecture
- [x] Google OAuth authentication working
- [x] Email/password authentication working
- [x] Events CRUD fully functional
- [x] Contacts CRUD fully functional
- [x] Occasions CRUD fully functional
- [x] Optimistic UI updates with error rollback
- [x] Auth guards on all protected routes
- [x] Production Supabase configuration
- [x] Database migrations with RLS policies
