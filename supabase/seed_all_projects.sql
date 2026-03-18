-- ============================================================================
-- Predivo API Dashboard — Add All Missing Projects & API Entries
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard/project/pjsxzjjhlwjqpkvsopuj/sql
-- Safe to re-run: skips duplicates
-- Generated: 2026-03-17
-- ============================================================================

BEGIN;

-- ============================================================================
-- PROJECTS — adds missing ones, skips existing (name is UNIQUE)
-- ============================================================================
INSERT INTO projects (name, description, color) VALUES
  ('Arivioo',                'Accommodation price comparison SaaS',                    '#E23647'),
  ('BelegPilot',             'AI-powered receipt & expense management',                '#F59E0B'),
  ('SignalScore',            'Swiss company credit intelligence platform',             '#2563EB'),
  ('SignalForgeAI',          'AI-powered crypto day-trading signals',                  '#8B5CF6'),
  ('ReplyFlow',              'AI Google review response automation',                   '#10B981'),
  ('LaunchReady',            'AI-powered product launch readiness audit',              '#EC4899'),
  ('YouTube Migration',      'YouTube playlist migration tool (TubeSwap)',             '#FF0000'),
  ('Distribution OS',        'Content distribution automation system',                 '#6366F1'),
  ('Predivo Website',        'Corporate website predivo.ch',                           '#0D9488'),
  ('API Dashboard',          'This dashboard (meta)',                                  '#0D9488'),
  ('GCIM',                   'Google Cloud Identity Management tool',                  '#4285F4'),
  ('Jass Tour UI Kit',       'Swiss Jass card game tournament app',                    '#D97706'),
  ('Project Starter',        'Automated project scaffolding & setup',                  '#64748B'),
  ('Claude Talk To Figma',   'MCP server for Claude-Figma integration',               '#A259FF')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- API ENTRIES — add unique constraint first, then insert safely
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_entries_name_provider_key'
  ) THEN
    ALTER TABLE api_entries ADD CONSTRAINT api_entries_name_provider_key UNIQUE (name, provider);
  END IF;
END $$;

INSERT INTO api_entries (name, provider, description, docs_url, base_url, api_type, category, billing_model, status) VALUES
  ('Supabase',               'Supabase',         'Database, Auth, Edge Functions, Storage',        'https://supabase.com/docs',             'https://supabase.co',                    'rest',      'auth',      'freemium',              'active'),
  ('Anthropic Claude',       'Anthropic',         'Claude AI models API',                           'https://docs.anthropic.com',            'https://api.anthropic.com',              'rest',      'ai',        'pay_as_you_go',         'active'),
  ('Google Gemini',          'Google',            'Gemini AI models API',                           'https://ai.google.dev/docs',            'https://generativelanguage.googleapis.com', 'rest',   'ai',        'freemium',              'active'),
  ('Stripe',                 'Stripe',            'Payment processing & subscriptions',             'https://stripe.com/docs/api',           'https://api.stripe.com',                 'rest',      'payment',   'pay_as_you_go',         'active'),
  ('SMTP Email',             'Various',           'SMTP email sending (transactional)',              NULL,                                    NULL,                                     'rest',      'email',     'freemium',              'active'),
  ('Firecrawl',              'Firecrawl',         'Web scraping & crawling API',                    'https://docs.firecrawl.dev',            'https://api.firecrawl.dev',              'rest',      'scraping',  'freemium',              'active'),
  ('Zyte',                   'Zyte',              'Web data extraction platform',                   'https://docs.zyte.com',                 'https://api.zyte.com',                   'rest',      'scraping',  'pay_as_you_go',         'active'),
  ('Browserless',            'Browserless',       'Headless Chrome browser API',                    'https://docs.browserless.io',           'https://chrome.browserless.io',          'rest',      'scraping',  'freemium',              'active'),
  ('SerpAPI',                'SerpAPI',           'Search engine results scraping',                 'https://serpapi.com/docs',              'https://serpapi.com',                    'rest',      'search',    'freemium',              'active'),
  ('Google Maps',            'Google',            'Maps, Geocoding, Places API',                    'https://developers.google.com/maps',    'https://maps.googleapis.com',            'rest',      'maps',      'pay_as_you_go',         'active'),
  ('Binance',                'Binance',           'Crypto exchange & market data',                  'https://binance-docs.github.io/apidocs','https://api.binance.com',                'rest',      'other',     'free',                  'active'),
  ('CoinGecko',              'CoinGecko',         'Crypto market data & prices',                    'https://docs.coingecko.com',            'https://api.coingecko.com',              'rest',      'other',     'freemium',              'active'),
  ('Zefix API',              'Swiss Federal',     'Swiss commercial register search',               'https://www.zefix.admin.ch',            'https://www.zefix.admin.ch/ZefixPublicREST', 'rest',  'search',    'free',                  'active'),
  ('SHAB',                   'Swiss Federal',     'Swiss Official Gazette of Commerce',             'https://www.shab.ch',                   'https://www.shab.ch',                    'rest',      'search',    'free',                  'active'),
  ('Google Cloud Identity',  'Google',            'Cloud Identity & Workspace Admin SDK',           'https://cloud.google.com/identity/docs','https://cloudidentity.googleapis.com',   'rest',      'auth',      'pay_as_you_go',         'active'),
  ('Google Business Profile','Google',            'Google Business reviews & management',           'https://developers.google.com/my-business', 'https://mybusiness.googleapis.com',  'rest',      'other',     'free',                  'active'),
  ('Google News',            'Google',            'Google News search results',                     NULL,                                    NULL,                                     'rest',      'search',    'free',                  'active'),
  ('LinkedIn',               'LinkedIn',          'LinkedIn profile & company data',                'https://docs.microsoft.com/en-us/linkedin/', 'https://api.linkedin.com',          'rest',      'other',     'freemium',              'active'),
  ('YouTube InnerTube',      'Google',            'YouTube internal API for playlist data',         NULL,                                    'https://www.youtube.com/youtubei/v1',    'rest',      'other',     'free',                  'active'),
  ('Google OAuth',           'Google',            'Google OAuth 2.0 authentication',                'https://developers.google.com/identity','https://oauth2.googleapis.com',          'rest',      'auth',      'free',                  'active'),
  ('Figma API',              'Figma',             'Figma design file access & manipulation',        'https://www.figma.com/developers/api',  'https://api.figma.com',                  'rest',      'other',     'free',                  'active'),
  ('Redis',                  'Redis',             'In-memory data store for caching',               'https://redis.io/docs',                 NULL,                                     'other',     'storage',   'free',                  'active'),
  ('TimescaleDB',            'Timescale',         'Time-series PostgreSQL extension',               'https://docs.timescale.com',            NULL,                                     'other',     'storage',   'free',                  'active'),
  ('GitHub Actions',         'GitHub',            'CI/CD workflows & automation',                   'https://docs.github.com/en/actions',    'https://api.github.com',                 'rest',      'other',     'freemium',              'active'),
  ('Playwright MCP',         'Microsoft',         'Browser automation via MCP server',              'https://playwright.dev/docs',           NULL,                                     'other',     'other',     'free',                  'active')
ON CONFLICT (name, provider) DO NOTHING;

-- ============================================================================
-- API-PROJECT ASSIGNMENTS (UNIQUE on api_entry_id + project_id)
-- ============================================================================

-- Arivioo
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'Arivioo'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Firecrawl'),        (SELECT id FROM projects WHERE name = 'Arivioo'), 'FIRECRAWL_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Zyte'),             (SELECT id FROM projects WHERE name = 'Arivioo'), 'ZYTE_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Browserless'),      (SELECT id FROM projects WHERE name = 'Arivioo'), 'BROWSERLESS_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Google Gemini'),    (SELECT id FROM projects WHERE name = 'Arivioo'), 'GEMINI_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Google Maps'),      (SELECT id FROM projects WHERE name = 'Arivioo'), 'GOOGLE_MAPS_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'SerpAPI'),          (SELECT id FROM projects WHERE name = 'Arivioo'), 'SERPAPI_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- BelegPilot
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'BelegPilot'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'), (SELECT id FROM projects WHERE name = 'BelegPilot'), 'ANTHROPIC_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Stripe'),           (SELECT id FROM projects WHERE name = 'BelegPilot'), 'STRIPE_SECRET_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'SMTP Email'),       (SELECT id FROM projects WHERE name = 'BelegPilot'), 'SMTP_HOST / SMTP_USER / SMTP_PASS')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- SignalScore
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'SignalScore'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'), (SELECT id FROM projects WHERE name = 'SignalScore'), 'ANTHROPIC_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Zefix API'),        (SELECT id FROM projects WHERE name = 'SignalScore'), NULL),
  ((SELECT id FROM api_entries WHERE name = 'SHAB'),             (SELECT id FROM projects WHERE name = 'SignalScore'), NULL),
  ((SELECT id FROM api_entries WHERE name = 'Firecrawl'),        (SELECT id FROM projects WHERE name = 'SignalScore'), 'FIRECRAWL_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Browserless'),      (SELECT id FROM projects WHERE name = 'SignalScore'), 'BROWSERLESS_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'LinkedIn'),         (SELECT id FROM projects WHERE name = 'SignalScore'), NULL),
  ((SELECT id FROM api_entries WHERE name = 'Google Maps'),      (SELECT id FROM projects WHERE name = 'SignalScore'), 'GOOGLE_MAPS_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Google News'),      (SELECT id FROM projects WHERE name = 'SignalScore'), NULL)
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- SignalForgeAI
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'), (SELECT id FROM projects WHERE name = 'SignalForgeAI'), 'ANTHROPIC_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Binance'),          (SELECT id FROM projects WHERE name = 'SignalForgeAI'), 'BINANCE_API_KEY / BINANCE_API_SECRET'),
  ((SELECT id FROM api_entries WHERE name = 'CoinGecko'),        (SELECT id FROM projects WHERE name = 'SignalForgeAI'), 'COINGECKO_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Redis'),            (SELECT id FROM projects WHERE name = 'SignalForgeAI'), 'REDIS_URL'),
  ((SELECT id FROM api_entries WHERE name = 'TimescaleDB'),      (SELECT id FROM projects WHERE name = 'SignalForgeAI'), 'TIMESCALE_URL')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- ReplyFlow
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),              (SELECT id FROM projects WHERE name = 'ReplyFlow'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'),      (SELECT id FROM projects WHERE name = 'ReplyFlow'), 'ANTHROPIC_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Google Business Profile'),(SELECT id FROM projects WHERE name = 'ReplyFlow'), 'GOOGLE_BUSINESS_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Stripe'),                (SELECT id FROM projects WHERE name = 'ReplyFlow'), 'STRIPE_SECRET_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'SMTP Email'),            (SELECT id FROM projects WHERE name = 'ReplyFlow'), 'SMTP_HOST / SMTP_USER / SMTP_PASS')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- LaunchReady
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'LaunchReady'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'), (SELECT id FROM projects WHERE name = 'LaunchReady'), 'ANTHROPIC_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Stripe'),           (SELECT id FROM projects WHERE name = 'LaunchReady'), 'STRIPE_SECRET_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- YouTube Migration (TubeSwap)
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'YouTube Migration'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'YouTube InnerTube'),(SELECT id FROM projects WHERE name = 'YouTube Migration'), NULL),
  ((SELECT id FROM api_entries WHERE name = 'Google OAuth'),     (SELECT id FROM projects WHERE name = 'YouTube Migration'), 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET'),
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'), (SELECT id FROM projects WHERE name = 'YouTube Migration'), 'ANTHROPIC_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Stripe'),           (SELECT id FROM projects WHERE name = 'YouTube Migration'), 'STRIPE_SECRET_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- Distribution OS
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'Distribution OS'), 'SUPABASE_URL / SUPABASE_ANON_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- Predivo Website
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'Predivo Website'), 'SUPABASE_URL / SUPABASE_ANON_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- API Dashboard
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'API Dashboard'), 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- GCIM
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Google Cloud Identity'), (SELECT id FROM projects WHERE name = 'GCIM'), 'GOOGLE_ADMIN_SDK_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- Jass Tour UI Kit
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase'),         (SELECT id FROM projects WHERE name = 'Jass Tour UI Kit'), 'SUPABASE_URL / SUPABASE_ANON_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- Project Starter
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Playwright MCP'),   (SELECT id FROM projects WHERE name = 'Project Starter'), NULL),
  ((SELECT id FROM api_entries WHERE name = 'GitHub Actions'),   (SELECT id FROM projects WHERE name = 'Project Starter'), 'GITHUB_TOKEN'),
  ((SELECT id FROM api_entries WHERE name = 'Anthropic Claude'), (SELECT id FROM projects WHERE name = 'Project Starter'), 'ANTHROPIC_API_KEY')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

-- Claude Talk To Figma
INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Figma API'),        (SELECT id FROM projects WHERE name = 'Claude Talk To Figma'), 'FIGMA_ACCESS_TOKEN')
ON CONFLICT (api_entry_id, project_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION — check what's in the database now
-- ============================================================================
SELECT 'PROJECTS (' || count(*) || ' total)' AS summary FROM projects;
SELECT name, description, color, status FROM projects ORDER BY name;

SELECT 'API ENTRIES (' || count(*) || ' total)' AS summary FROM api_entries;
SELECT name, provider, category, billing_model FROM api_entries ORDER BY provider, name;

SELECT 'ASSIGNMENTS (' || count(*) || ' total)' AS summary FROM api_project_assignments;
SELECT p.name AS project, ae.name AS api, apa.env_var_name
FROM api_project_assignments apa
JOIN projects p ON p.id = apa.project_id
JOIN api_entries ae ON ae.id = apa.api_entry_id
ORDER BY p.name, ae.name;
