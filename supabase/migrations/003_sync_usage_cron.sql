-- Schedule sync-usage edge function to run every 6 hours via pg_cron
-- Fetches live usage data from SerpAPI, Firecrawl, and Anthropic
-- Requires pg_cron and pg_net extensions (Supabase paid plan)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Run at 00:00, 06:00, 12:00, 18:00 UTC daily
SELECT cron.schedule(
  'sync-usage-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://pjsxzjjhlwjqpkvsopuj.supabase.co/functions/v1/sync-usage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sync-usage-cron-1b101455280a2e66341baf24b4cfe7e3'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
