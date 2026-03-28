-- ============================================================================
-- Arivioo API Inventory — Verified data from codebase audit (2026-03-25)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/pjsxzjjhlwjqpkvsopuj/sql
-- Safe to re-run: uses ON CONFLICT to skip duplicates, UPDATE for account info
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENSURE PROJECT EXISTS
-- ============================================================================
INSERT INTO projects (name, description, color)
VALUES ('Arivioo', 'Accommodation price comparison SaaS', '#E23647')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ENSURE UNIQUE CONSTRAINT ON api_entries
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_entries_name_provider_key'
  ) THEN
    ALTER TABLE api_entries ADD CONSTRAINT api_entries_name_provider_key UNIQUE (name, provider);
  END IF;
END $$;

-- ============================================================================
-- API ENTRIES — insert missing, update account info on existing
-- ============================================================================

-- OpenAI (missing from original seed)
INSERT INTO api_entries (name, provider, description, docs_url, base_url, api_type, category, account_owner, account_email, billing_model, status)
VALUES ('OpenAI', 'OpenAI', 'GPT models for AI text analysis & price extraction', 'https://platform.openai.com/docs', 'https://api.openai.com', 'rest', 'ai', 'Roger Mueller', 'roger@mueller.ro', 'pay_as_you_go', 'active')
ON CONFLICT (name, provider) DO UPDATE SET account_owner = EXCLUDED.account_owner, account_email = EXCLUDED.account_email;

-- Supabase
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'roger@mueller.ro'
WHERE name = 'Supabase' AND provider = 'Supabase';

-- Firecrawl (primary: roger@mueller.ro, alts: rogmueindia, sandrinepeterss@gmail.com)
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'roger@mueller.ro',
  notes = 'Primary: roger@mueller.ro. Alt accounts: rogmueindia, sandrinepeterss@gmail.com (3 rotating keys)'
WHERE name = 'Firecrawl' AND provider = 'Firecrawl';

-- Zyte (primary: roger@mueller.ro, alt: lakeviewer1976@gmail.com)
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'roger@mueller.ro',
  notes = 'Primary: roger@mueller.ro. Alt account: lakeviewer1976@gmail.com'
WHERE name = 'Zyte' AND provider = 'Zyte';

-- Browserless (3 rotating accounts with staggered billing)
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'lakeviewer1976@gmail.com',
  notes = '3 rotating accounts: lakeviewer1976 (resets Feb 28), rogmueller1976 (resets Mar 6), sandrinepeterss (resets Mar 13)'
WHERE name = 'Browserless' AND provider = 'Browserless';

-- SerpAPI
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'lakeviewer1976@gmail.com',
  notes = 'Login via Google OAuth (lakeviewer1976@gmail.com)'
WHERE name = 'SerpAPI' AND provider = 'SerpAPI';

-- Google Gemini
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'lakeviewer1976@gmail.com',
  notes = 'GCP project: gen-lang-client-0258338980'
WHERE name = 'Google Gemini' AND provider = 'Google';

-- Stripe
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'hello@predivo.ch'
WHERE name = 'Stripe' AND provider = 'Stripe';

-- SMTP Email (MetaNet)
UPDATE api_entries SET account_owner = 'Roger Mueller', account_email = 'roger@mueller.ro',
  description = 'MetaNet SMTP transactional email (Plesk hosting)',
  notes = 'Each project has its own mailbox on MetaNet. Arivioo: noreply@arivioo.com'
WHERE name = 'SMTP Email' AND provider = 'Various';

-- ============================================================================
-- ARIVIOO PROJECT ASSIGNMENTS
-- ============================================================================

-- Ensure unique constraint on assignments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_project_assignments_api_entry_id_project_id_key'
  ) THEN
    ALTER TABLE api_project_assignments ADD CONSTRAINT api_project_assignments_api_entry_id_project_id_key UNIQUE (api_entry_id, project_id);
  END IF;
END $$;

INSERT INTO api_project_assignments (api_entry_id, project_id, env_var_name) VALUES
  ((SELECT id FROM api_entries WHERE name = 'Supabase' AND provider = 'Supabase'),       (SELECT id FROM projects WHERE name = 'Arivioo'), 'SUPABASE_URL / SUPABASE_ANON_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Firecrawl' AND provider = 'Firecrawl'),     (SELECT id FROM projects WHERE name = 'Arivioo'), 'FIRECRAWL_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Zyte' AND provider = 'Zyte'),               (SELECT id FROM projects WHERE name = 'Arivioo'), 'ZYTE_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Browserless' AND provider = 'Browserless'), (SELECT id FROM projects WHERE name = 'Arivioo'), 'BROWSERLESS_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Google Gemini' AND provider = 'Google'),    (SELECT id FROM projects WHERE name = 'Arivioo'), 'GEMINI_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'SerpAPI' AND provider = 'SerpAPI'),         (SELECT id FROM projects WHERE name = 'Arivioo'), 'SERPAPI_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'OpenAI' AND provider = 'OpenAI'),           (SELECT id FROM projects WHERE name = 'Arivioo'), 'OPENAI_API_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'Stripe' AND provider = 'Stripe'),           (SELECT id FROM projects WHERE name = 'Arivioo'), 'STRIPE_SECRET_KEY'),
  ((SELECT id FROM api_entries WHERE name = 'SMTP Email' AND provider = 'Various'),      (SELECT id FROM projects WHERE name = 'Arivioo'), 'SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS')
ON CONFLICT (api_entry_id, project_id) DO UPDATE SET env_var_name = EXCLUDED.env_var_name;

-- Remove Google Maps assignment for Arivioo (not actually used in code)
DELETE FROM api_project_assignments
WHERE api_entry_id = (SELECT id FROM api_entries WHERE name = 'Google Maps' AND provider = 'Google')
  AND project_id = (SELECT id FROM projects WHERE name = 'Arivioo');

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT ae.name AS api, ae.provider, ae.account_email, ae.billing_model, apa.env_var_name
FROM api_project_assignments apa
JOIN api_entries ae ON ae.id = apa.api_entry_id
JOIN projects p ON p.id = apa.project_id
WHERE p.name = 'Arivioo'
ORDER BY ae.name;
