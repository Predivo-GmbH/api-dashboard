BEGIN;

-- ========================================
-- STEP 1: Create 4 new API entries
-- ========================================
INSERT INTO api_entries (name, provider, status, billing_model) VALUES
  ('Wyscout', 'Wyscout', 'active', 'monthly_subscription'),
  ('StatsBomb', 'StatsBomb', 'active', 'monthly_subscription'),
  ('Facebook Graph API', 'Meta', 'active', 'free'),
  ('CCXT', 'Open Source', 'active', 'free')
ON CONFLICT DO NOTHING;

-- ========================================
-- STEP 2: Insert assignments for 10 projects
-- ========================================

-- Distribution-OS (2)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'Distribution OS', 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'),
  ('Stripe', 'Distribution OS', 'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- GCIM (1)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Google Cloud Identity', 'GCIM', 'GCIM_SERVICE_ACCOUNT_KEY_PATH / GCIM_ADMIN_EMAIL')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- Jass Tour UI Kit (1)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'Jass Tour UI Kit', 'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- LaunchReady (2)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'LaunchReady', 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  ('Anthropic Claude', 'LaunchReady', 'ANTHROPIC_API_KEY')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- ReplyFlow (6)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'ReplyFlow', 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'),
  ('Stripe', 'ReplyFlow', 'STRIPE_WEBHOOK_SECRET / VITE_STRIPE_PUBLISHABLE_KEY'),
  ('Anthropic Claude', 'ReplyFlow', 'ANTHROPIC_API_KEY'),
  ('Google OAuth', 'ReplyFlow', 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET'),
  ('Google Business Profile', 'ReplyFlow', 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET'),
  ('Facebook Graph API', 'ReplyFlow', 'access_token (edge function)')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- ScoutCopilot (5)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'ScoutCopilot', 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'),
  ('Stripe', 'ScoutCopilot', 'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET'),
  ('Anthropic Claude', 'ScoutCopilot', 'ANTHROPIC_API_KEY'),
  ('Wyscout', 'ScoutCopilot', 'WYSCOUT_BASE_URL'),
  ('StatsBomb', 'ScoutCopilot', 'STATSBOMB_API (edge function)')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- SignalForgeAI (3)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'SignalForgeAI', 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'),
  ('Anthropic Claude', 'SignalForgeAI', 'ANTHROPIC_API_KEY'),
  ('CCXT', 'SignalForgeAI', 'CCXT (exchange credentials in edge functions)')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- SignalScore (6)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'SignalScore', 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'),
  ('Anthropic Claude', 'SignalScore', 'ANTHROPIC_API_KEY'),
  ('SerpAPI', 'SignalScore', 'SERPAPI_API_KEY'),
  ('Firecrawl', 'SignalScore', 'FIRECRAWL_API_KEY_1'),
  ('Google Maps Places', 'SignalScore', 'GOOGLE_MAPS_API_KEY'),
  ('Zefix API', 'SignalScore', 'ZEFIX_USERNAME / ZEFIX_PASSWORD')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- YouTube Migration (5)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name)
SELECT ae.id, p.id, v.env_var
FROM (VALUES
  ('Supabase', 'YouTube Migration', 'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  ('Anthropic Claude', 'YouTube Migration', 'ANTHROPIC_API_KEY'),
  ('Stripe', 'YouTube Migration', 'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_ID_*'),
  ('Google OAuth', 'YouTube Migration', 'EXPO_PUBLIC_GOOGLE_CLIENT_ID / EXPO_PUBLIC_GOOGLE_*_CLIENT_ID'),
  ('YouTube InnerTube', 'YouTube Migration', 'hardcoded keys in _shared/innertubeClient.ts')
) AS v(api_name, proj_name, env_var)
JOIN api_entries ae ON ae.name = v.api_name
JOIN projects p ON p.name = v.proj_name
ON CONFLICT DO NOTHING;

-- ========================================
-- STEP 3: Delete unused/duplicate API entries
-- ========================================
DELETE FROM api_project_assignments WHERE api_entry_id IN (
  SELECT id FROM api_entries WHERE name IN (
    'Binance', 'Redis', 'TimescaleDB', 'Google Maps', 'Google News',
    'Google OAuth 2.0', 'LinkedIn', 'SHAB', 'Zefix REST API'
  )
);
DELETE FROM api_entries WHERE name IN (
  'Binance', 'Redis', 'TimescaleDB', 'Google Maps', 'Google News',
  'Google OAuth 2.0', 'LinkedIn', 'SHAB', 'Zefix REST API'
);

COMMIT;
