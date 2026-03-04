-- ============================================================================
-- Security Fixes — Supabase Security Advisor Remediation
-- ============================================================================

-- ============================================================================
-- FIX 1: Move extensions from public to extensions schema (Advisor 0014)
-- ============================================================================
-- Supabase provides an 'extensions' schema by default.
-- Moving extensions out of public reduces API attack surface.

DROP EXTENSION IF EXISTS "pgcrypto";

DROP INDEX IF EXISTS idx_api_entries_name_trgm;
DROP EXTENSION IF EXISTS "pg_trgm";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;

CREATE INDEX idx_api_entries_name_trgm ON api_entries USING gin (name extensions.gin_trgm_ops);

-- ============================================================================
-- FIX 2: Recreate views with security_invoker = true (Advisor 0010)
-- ============================================================================
-- By default, Postgres views are "security definer" and bypass RLS.
-- Setting security_invoker = true makes them respect the caller's RLS policies.

DROP VIEW IF EXISTS v_api_overview;
DROP VIEW IF EXISTS v_monthly_cost_by_project;
DROP VIEW IF EXISTS v_api_health_latest;

CREATE OR REPLACE VIEW v_api_health_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (api_entry_id)
  api_entry_id,
  status,
  response_time_ms,
  status_code,
  error_message,
  checked_at
FROM health_checks
ORDER BY api_entry_id, checked_at DESC;

CREATE OR REPLACE VIEW v_monthly_cost_by_project
WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  date_trunc('month', ur.period_start) AS month,
  SUM(ur.cost) AS total_cost,
  SUM(ur.call_count) AS total_calls
FROM usage_records ur
JOIN projects p ON p.id = ur.project_id
GROUP BY p.id, p.name, date_trunc('month', ur.period_start)
ORDER BY month DESC, p.name;

CREATE OR REPLACE VIEW v_api_overview
WITH (security_invoker = true) AS
SELECT
  ae.id,
  ae.name,
  ae.provider,
  ae.category,
  ae.status,
  ae.account_owner,
  h.status AS health_status,
  h.response_time_ms AS health_response_ms,
  h.checked_at AS last_health_check,
  s.plan_name,
  s.quota_limit,
  s.current_usage,
  s.renewal_date,
  s.cost_per_period,
  CASE
    WHEN s.quota_limit IS NOT NULL AND s.quota_limit > 0
    THEN ROUND((s.current_usage::NUMERIC / s.quota_limit) * 100, 1)
    ELSE NULL
  END AS quota_usage_pct
FROM api_entries ae
LEFT JOIN v_api_health_latest h ON h.api_entry_id = ae.id
LEFT JOIN subscriptions s ON s.api_entry_id = ae.id;

-- ============================================================================
-- FIX 3: Restrict permissive INSERT policies to service_role (Advisor 0024)
-- ============================================================================
-- The original policies used WITH CHECK (TRUE) which allows ANY user to insert.
-- These should be restricted to the service_role only.

DROP POLICY IF EXISTS "service_insert_audit" ON audit_logs;
DROP POLICY IF EXISTS "service_insert_health" ON health_checks;
DROP POLICY IF EXISTS "service_insert_triggered" ON triggered_alerts;

CREATE POLICY "service_insert_audit" ON audit_logs
  FOR INSERT TO service_role WITH CHECK (TRUE);

CREATE POLICY "service_insert_health" ON health_checks
  FOR INSERT TO service_role WITH CHECK (TRUE);

CREATE POLICY "service_insert_triggered" ON triggered_alerts
  FOR INSERT TO service_role WITH CHECK (TRUE);

-- ============================================================================
-- FIX 4: Set fixed search_path on functions (Advisor 0009)
-- ============================================================================
-- Functions without a fixed search_path are vulnerable to search path attacks.

ALTER FUNCTION update_updated_at() SET search_path = public;
