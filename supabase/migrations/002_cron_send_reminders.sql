-- Hourly cron: invoke send-reminders edge function
-- Replace YOUR_PROJECT_REF and YOUR_ANON_KEY before running in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previous reminder cron jobs
SELECT cron.unschedule('send-hourly-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-hourly-reminders'
);

SELECT cron.unschedule('send-daily-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-daily-reminders'
);

SELECT cron.schedule(
  'send-hourly-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rntnwarjiejeqfrsyzvr.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudG53YXJqaWVqZXFmcnN5enZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjgyMjEsImV4cCI6MjA4MTc0NDIyMX0.doB4Ae_KmyeTy3rPPMG0Hzm7_gcIMPFLAj3H4BWeYxQ'
    ),
    body := '{}'::jsonb
  );
  $$
);
