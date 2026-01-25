# Tasks - Current Sprint

_Active work items for My Calendar MVP_

---

## 🚧 Phase 6: Email Reminders

**Goal**: Email-based reminders for upcoming events via Supabase

**Status**: Frontend complete, backend implementation needed

---

### Step 1: Create Database Table

**Where**: Supabase Dashboard → SQL Editor

Create the `user_notification_preferences` table:

```sql
-- Create table
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_reminders_enabled BOOLEAN DEFAULT false,
  reminder_days INTEGER[] DEFAULT ARRAY[1, 7],
  reminder_time TEXT DEFAULT '09:00',
  timezone TEXT DEFAULT 'UTC',
  last_reminder_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Checklist:**

- [x] Run SQL in Supabase Dashboard
- [x] Verify table created in Table Editor
- [x] Test insert/select with test user

---

### Step 2: Set Up Resend Email Provider

**Why Resend?** Modern API, great DX, generous free tier (100 emails/day)

1. **Create Resend Account**

   - Go to https://resend.com
   - Sign up with GitHub or email
   - Verify email address

2. **Get API Key**

   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)

3. **Add to Supabase Secrets**
   - Supabase Dashboard → Project Settings → Edge Functions
   - Add secret: `RESEND_API_KEY` = your API key

**Checklist:**

- [x] Create Resend account
- [x] Generate API key
- [x] Add `RESEND_API_KEY` to Supabase secrets
- [ ] (Optional) Verify custom domain for better deliverability

---

### Step 3: Create Edge Function - send-test-reminder-email

**Where**: Supabase Dashboard → Edge Functions → New Function

**Purpose**: Send a test email immediately to verify setup

```typescript
// supabase/functions/send-test-reminder-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user email from Supabase Auth
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(user_id);

    if (!user?.email) {
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send test email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "My Calendar <reminders@yourdomain.com>",
        to: [user.email],
        subject: "🧪 Test Email - My Calendar Reminders",
        html: `
          <h1>Test Email Successful! ✅</h1>
          <p>Your email reminder settings are working correctly.</p>
          <p>You'll receive reminders for upcoming events based on your preferences.</p>
          <hr>
          <p><small>This is a test email from My Calendar.</small></p>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

**Checklist:**

- [x] Create Edge Function in Supabase Dashboard
- [x] Deploy function
- [x] Test via Dashboard: Invoke with `{ "user_id": "your-user-id" }`
- [x] Verify email received in inbox

---

### Step 4: Create Edge Function - send-reminders

**Where**: Supabase Dashboard → Edge Functions → New Function

**Purpose**: Daily cron job to send reminder emails

```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Get users with email reminders enabled
    const { data: preferences, error: prefError } = await supabase.from("user_notification_preferences").select("*").eq("email_reminders_enabled", true);

    if (prefError) throw prefError;
    if (!preferences?.length) {
      return new Response(JSON.stringify({ message: "No users with reminders enabled" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    let emailsSent = 0;

    for (const pref of preferences) {
      // Get user email
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(pref.user_id);
      if (!user?.email) continue;

      // Get user's events for the reminder window
      const today = new Date();
      const maxDays = Math.max(...pref.reminder_days);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + maxDays);

      const { data: events } = await supabase.from("events").select("*").eq("user_id", pref.user_id).gte("start_date", today.toISOString().split("T")[0]).lte("start_date", endDate.toISOString().split("T")[0]);

      if (!events?.length) continue;

      // Filter events matching reminder days
      const upcomingEvents = events.filter((event) => {
        const eventDate = new Date(event.start_date);
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return pref.reminder_days.includes(daysUntil);
      });

      if (!upcomingEvents.length) continue;

      // Build email content
      const eventList = upcomingEvents
        .map((e) => {
          const eventDate = new Date(e.start_date);
          const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return `<li><strong>${e.title}</strong> - ${eventDate.toLocaleDateString()} (in ${daysUntil} day${daysUntil !== 1 ? "s" : ""})</li>`;
        })
        .join("");

      // Send email
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "My Calendar <reminders@yourdomain.com>",
          to: [user.email],
          subject: `📅 Upcoming Events Reminder (${upcomingEvents.length} event${upcomingEvents.length !== 1 ? "s" : ""})`,
          html: `
            <h1>Upcoming Events</h1>
            <p>You have the following events coming up:</p>
            <ul>${eventList}</ul>
            <hr>
            <p><a href="https://my-calendar-frontend-mvp.vercel.app">Open My Calendar</a></p>
            <p><small>To change your reminder preferences, visit Settings in the app.</small></p>
          `,
        }),
      });

      if (res.ok) {
        emailsSent++;
        // Update last_reminder_sent
        await supabase.from("user_notification_preferences").update({ last_reminder_sent: new Date().toISOString() }).eq("user_id", pref.user_id);
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

**Checklist:**

- [x] Create Edge Function in Supabase Dashboard
- [x] Deploy function
- [x] Test manually via Dashboard invoke
- [x] Verify emails are sent correctly

---

### Step 5: Set Up Cron Job

**Where**: Supabase Dashboard → Database → Cron

Create a scheduled job to run `send-reminders` daily:

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job (runs daily at 9 AM UTC)
SELECT cron.schedule(
  'send-daily-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Alternative**: Use Supabase Dashboard → Database → Extensions → pg_cron

**Checklist:**

- [x] Enable pg_cron extension
- [x] Create cron job
- [x] Verify job in cron.job table
- [x] Monitor execution logs

---

### Step 6: Update Frontend Service

Update `NotificationPreferencesService` to call the test email function:

**File**: `src/app/services/notification-preferences.service.ts`

Update the `sendTestEmail()` method to invoke the Edge Function:

```typescript
async sendTestEmail(): Promise<void> {
  this._sending.set(true);
  try {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    const { error } = await this.supabase.client.functions.invoke(
      'send-test-reminder-email',
      { body: { user_id: userId } }
    );

    if (error) throw error;
    this.notification.success('Test email sent! Check your inbox.');
  } catch (error) {
    console.error('Failed to send test email:', error);
    this.notification.error('Failed to send test email. Please try again.');
  } finally {
    this._sending.set(false);
  }
}
```

**Checklist:**

- [x] Update sendTestEmail method
- [x] Test from Settings page
- [x] Verify email received

---

### Step 7: Testing & Verification

**Frontend Testing:**

- [ ] Toggle email reminders on/off
- [ ] Select different reminder days
- [ ] Change reminder time
- [ ] Change timezone
- [ ] Click "Send Test Email" → verify email arrives

**Backend Testing:**

- [ ] Invoke `send-test-reminder-email` from Supabase Dashboard
- [ ] Invoke `send-reminders` manually
- [ ] Check Edge Function logs for errors
- [ ] Verify emails are received in inbox

**Production Testing:**

- [ ] Create event 1 day from today
- [ ] Enable email reminders with "1 day before"
- [ ] Wait for next cron run (9 AM UTC)
- [ ] Verify reminder email received

---

## ✅ Completed (Archive)

<details>
<summary>Phase 1-5 & 7 Completed Items (click to expand)</summary>

### Phase 1-3: Core Features & Supabase

- FullCalendar integration with views
- Event/Contact/Occasion CRUD
- Supabase authentication (email + Google OAuth)
- PostgreSQL database with RLS
- Optimistic UI updates

### Phase 4: Polish & Accessibility

- Loading spinners and error notifications
- Global error handler service
- ARIA labels on all elements
- Keyboard navigation
- Empty states and confirm dialogs
- Dark mode (light/dark/auto)
- Responsive hamburger menu
- CSS animations

### Phase 5: Production Deployment

- Deployed to Vercel
- Production Supabase configuration
- Google OAuth working
- All features tested

### Phase 7: Internationalization

- 4 languages (EN, RU, UA, FI)
- TranslationService with signals
- TranslatePipe for templates
- Language selector in Settings

</details>

---

## 🔮 Future Enhancements

### Phase 8: AI Features (Optional)

- Natural language event parsing
- Smart reminder suggestions
- Gift/activity suggestions

### Post-MVP: Testing

- Unit tests for services
- Component tests for modals
- E2E tests for critical flows

---

## Quick Reference

| Command         | Description                 |
| --------------- | --------------------------- |
| `npm start`     | Dev server (localhost:4200) |
| `npm run lint`  | Run ESLint                  |
| `npm run build` | Production build            |

**Supabase Dashboard**: https://supabase.com/dashboard

**Production URL**: https://my-calendar-frontend-mvp.vercel.app
