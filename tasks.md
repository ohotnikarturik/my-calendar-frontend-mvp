# Tasks - Current Sprint

_Active work items for My Calendar MVP_

## Priority: High 🔴

### 1. Supabase Project Setup

Create Supabase project and configure environment.

**Steps:**

1. Go to supabase.com → New Project
2. Copy project URL and anon key
3. Update `src/environments/environment.ts`:
   ```typescript
   supabaseUrl: 'your-project-url',
   supabaseKey: 'your-anon-key'
   ```
4. Set `DEV_MODE_BYPASS_AUTH = false` in supabase.service.ts

### 2. Database Migrations

Run these SQL commands in Supabase SQL Editor:

```sql
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  description TEXT,
  color TEXT,
  reminder_days INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birthday DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Occasions table
CREATE TABLE occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own occasions" ON occasions
  FOR ALL USING (auth.uid() = user_id);
```

---

## Priority: Medium 🟡

### 3. Accessibility Improvements

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

### 6. UI Polish

- Empty state illustrations
- Smooth animations on transitions
- Better mobile navigation

### 7. Testing

- Unit tests for services
- Component tests for modals
- E2E tests for critical flows

---

## Completed Recently ✅

- [x] Automatic background sync (debounced + periodic)
- [x] Offline grace period for auth
- [x] Auth guards on all routes
- [x] Nav links hidden when not authenticated
- [x] Data Storage & Privacy section in About page
- [x] DEV_MODE_BYPASS_AUTH toggle
