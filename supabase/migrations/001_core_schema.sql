-- ============================================================================
-- Predivo API Management Dashboard — Core Schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- PROJECTS
-- ============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO projects (name, description, color) VALUES
  ('Arivioo',         'Accommodation price comparison SaaS',     '#E23647'),
  ('TubeSwap',        'YouTube playlist migration tool',         '#FF0000'),
  ('SignalScore',     'Swiss company credit intelligence',       '#2563EB'),
  ('Predivo Website', 'Corporate website',                       '#14B8A6'),
  ('API Dashboard',   'This dashboard (meta)',                   '#8B5CF6');

-- ============================================================================
-- API_ENTRIES
-- ============================================================================
CREATE TABLE api_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  docs_url TEXT,
  base_url TEXT,
  health_check_url TEXT,
  health_check_method TEXT DEFAULT 'GET'
    CHECK (health_check_method IN ('GET', 'HEAD', 'POST')),
  api_type TEXT NOT NULL DEFAULT 'rest'
    CHECK (api_type IN ('rest', 'graphql', 'grpc', 'websocket', 'sparql')),
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN (
      'search', 'scraping', 'ai', 'email', 'payment',
      'analytics', 'storage', 'auth', 'maps', 'other'
    )),
  account_owner TEXT,
  account_email TEXT,
  billing_model TEXT NOT NULL DEFAULT 'pay_as_you_go'
    CHECK (billing_model IN (
      'free', 'pay_as_you_go', 'monthly_subscription',
      'annual_subscription', 'one_time', 'freemium'
    )),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'deprecated', 'error', 'rate_limited')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_entries_name_trgm ON api_entries USING gin (name gin_trgm_ops);
CREATE INDEX idx_api_entries_provider ON api_entries(provider);
CREATE INDEX idx_api_entries_status ON api_entries(status);
CREATE INDEX idx_api_entries_category ON api_entries(category);

-- ============================================================================
-- API_PROJECT_ASSIGNMENTS (many-to-many)
-- ============================================================================
CREATE TABLE api_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  env_var_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (api_entry_id, project_id)
);

CREATE INDEX idx_apa_api ON api_project_assignments(api_entry_id);
CREATE INDEX idx_apa_project ON api_project_assignments(project_id);

-- ============================================================================
-- API_CREDENTIALS (encrypted keys)
-- ============================================================================
CREATE TABLE api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'default',
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  key_hint TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_api_creds_entry ON api_credentials(api_entry_id);
CREATE INDEX idx_api_creds_active ON api_credentials(api_entry_id) WHERE is_active = TRUE;

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual', 'one_time', 'none')),
  cost_per_period NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  renewal_date DATE,
  quota_limit INTEGER,
  quota_unit TEXT DEFAULT 'credits',
  current_usage INTEGER NOT NULL DEFAULT 0,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_api ON subscriptions(api_entry_id);
CREATE INDEX idx_subs_renewal ON subscriptions(renewal_date) WHERE renewal_date IS NOT NULL;

-- ============================================================================
-- USAGE_RECORDS
-- ============================================================================
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER,
  cost NUMERIC(10,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto_fetch', 'api_import')),
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_api ON usage_records(api_entry_id, period_start DESC);
CREATE INDEX idx_usage_project ON usage_records(project_id, period_start DESC);

-- ============================================================================
-- HEALTH_CHECKS
-- ============================================================================
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  status TEXT NOT NULL
    CHECK (status IN ('up', 'down', 'degraded', 'timeout', 'unknown')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_api ON health_checks(api_entry_id, checked_at DESC);
CREATE INDEX idx_health_recent ON health_checks(checked_at DESC);

-- ============================================================================
-- AUDIT_LOGS
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_entity TEXT,
  target_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_entity, target_id, created_at DESC);

-- ============================================================================
-- ALERT_SETTINGS
-- ============================================================================
CREATE TABLE alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL
    CHECK (alert_type IN (
      'quota_warning', 'quota_critical', 'renewal_reminder',
      'health_alert', 'cost_threshold', 'key_expiration'
    )),
  threshold INTEGER,
  email_recipients TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (api_entry_id, alert_type)
);

CREATE INDEX idx_alerts_api ON alert_settings(api_entry_id);
CREATE INDEX idx_alerts_enabled ON alert_settings(enabled) WHERE enabled = TRUE;

-- ============================================================================
-- TRIGGERED_ALERTS
-- ============================================================================
CREATE TABLE triggered_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_setting_id UUID NOT NULL REFERENCES alert_settings(id) ON DELETE CASCADE,
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX idx_triggered_api ON triggered_alerts(api_entry_id, sent_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggered_alerts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read and write (internal admin tool)
CREATE POLICY "auth_all" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON api_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON api_project_assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON api_credentials FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON subscriptions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON usage_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON health_checks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON alert_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read" ON triggered_alerts FOR SELECT USING (auth.role() = 'authenticated');

-- Service role can insert audit logs and health checks
CREATE POLICY "service_insert_audit" ON audit_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "service_insert_health" ON health_checks FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "service_insert_triggered" ON triggered_alerts FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_api_entries_updated
  BEFORE UPDATE ON api_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_api_health_latest AS
SELECT DISTINCT ON (api_entry_id)
  api_entry_id,
  status,
  response_time_ms,
  status_code,
  error_message,
  checked_at
FROM health_checks
ORDER BY api_entry_id, checked_at DESC;

CREATE OR REPLACE VIEW v_monthly_cost_by_project AS
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

CREATE OR REPLACE VIEW v_api_overview AS
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
