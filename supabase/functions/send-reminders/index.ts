/// <reference path="../types/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL =
  Deno.env.get('REMINDER_FROM_EMAIL') ?? 'My Calendar <onboarding@resend.dev>';
const APP_URL =
  Deno.env.get('APP_URL') ?? 'https://my-calendar-frontend-mvp.vercel.app';

interface CalendarEventRow {
  id: string;
  user_id: string;
  title: string;
  start: string;
  repeat_annually: boolean;
  reminder_enabled: boolean;
  reminder_days_before: number | null;
}

interface UserPreferences {
  user_id: string;
  email_reminders_enabled: boolean;
  reminder_days: number[];
  reminder_time: string;
  timezone: string;
  last_reminder_sent: string | null;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function parseDate(value: string): Date {
  if (value.length === 10 && value.includes('-')) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function getAnnualOccurrenceInYear(start: string, year: number): Date {
  const parsed = parseDate(start);
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const candidate = new Date(year, month, day);
  if (candidate.getMonth() !== month) {
    return new Date(year, month + 1, 0);
  }
  return candidate;
}

function daysBetween(from: Date, to: Date): number {
  const diff = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getNextOccurrence(start: string, repeatAnnually: boolean, today: Date): Date {
  const eventDate = startOfDay(parseDate(start));
  if (!repeatAnnually) {
    return eventDate;
  }

  const currentYear = today.getFullYear();
  let occurrence = getAnnualOccurrenceInYear(start, currentYear);
  if (occurrence < today) {
    occurrence = getAnnualOccurrenceInYear(start, currentYear + 1);
  }
  return occurrence;
}

function shouldSendReminder(
  event: CalendarEventRow,
  pref: UserPreferences,
  today: Date
): boolean {
  if (!event.reminder_enabled) {
    return false;
  }

  const occurrence = getNextOccurrence(event.start, event.repeat_annually, today);
  const daysUntil = daysBetween(today, occurrence);

  const globalDays = pref.reminder_days ?? [];
  const eventDay = event.reminder_days_before;

  if (typeof eventDay === 'number' && daysUntil === eventDay) {
    return true;
  }

  return globalDays.includes(daysUntil);
}

function isUserReminderHour(pref: UserPreferences, now: Date): boolean {
  const [targetHour] = (pref.reminder_time ?? '09:00').split(':').map(Number);
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: pref.timezone || 'UTC',
      hour: 'numeric',
      hour12: false,
    });
    const userHour = Number(formatter.format(now));
    return userHour === targetHour;
  } catch {
    return now.getUTCHours() === targetHour;
  }
}

function alreadySentToday(lastSent: string | null, timezone: string, now: Date): boolean {
  if (!lastSent) return false;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date(lastSent)) === formatter.format(now);
}

serve(async () => {
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const today = startOfDay(now);

    const { data: preferences, error: prefError } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('email_reminders_enabled', true);

    if (prefError) throw prefError;

    if (!preferences?.length) {
      return new Response(JSON.stringify({ message: 'No users with reminders enabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let emailsSent = 0;

    for (const pref of preferences as UserPreferences[]) {
      if (!isUserReminderHour(pref, now)) continue;
      if (alreadySentToday(pref.last_reminder_sent, pref.timezone, now)) continue;

      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(pref.user_id);

      if (!user?.email) continue;

      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select(
          'id, user_id, title, start, repeat_annually, reminder_enabled, reminder_days_before'
        )
        .eq('user_id', pref.user_id);

      if (eventsError) throw eventsError;
      if (!events?.length) continue;

      const matchingEvents = (events as CalendarEventRow[]).filter((event) =>
        shouldSendReminder(event, pref, today)
      );

      if (!matchingEvents.length) continue;

      const eventList = matchingEvents
        .map((event) => {
          const occurrence = getNextOccurrence(
            event.start,
            event.repeat_annually,
            today
          );
          const daysUntil = daysBetween(today, occurrence);
          const label = daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
          return `<li><strong>${event.title}</strong> - ${occurrence.toLocaleDateString()} (${label})</li>`;
        })
        .join('');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [user.email],
          subject: `Upcoming Events Reminder (${matchingEvents.length})`,
          html: `
            <h1>Upcoming Events</h1>
            <p>You have the following events coming up:</p>
            <ul>${eventList}</ul>
            <hr>
            <p><a href="${APP_URL}">Open My Calendar</a></p>
            <p><small>To change your reminder preferences, visit Settings in the app.</small></p>
          `,
        }),
      });

      if (res.ok) {
        emailsSent++;
        await supabase
          .from('user_notification_preferences')
          .update({ last_reminder_sent: now.toISOString() })
          .eq('user_id', pref.user_id);
      } else {
        const errorBody = await res.json();
        console.error('Resend error for user', pref.user_id, errorBody);
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
