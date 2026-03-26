-- Add credits_remaining to subscriptions for absolute balance tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS credits_remaining NUMERIC;

-- Table to store credit balance snapshots (for Anthropic-style prepaid tracking)
CREATE TABLE IF NOT EXISTS credit_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_entry_id UUID NOT NULL REFERENCES api_entries(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(api_entry_id)
);
ALTER TABLE credit_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON credit_snapshots FOR ALL USING (auth.role() = 'authenticated');

-- Update v_api_overview to include credits_remaining
DROP VIEW IF EXISTS v_api_overview;
CREATE VIEW v_api_overview
WITH (security_invoker = true) AS
SELECT
  ae.id,
  ae.name,
  ae.provider,
  ae.category,
  ae.status,
  ae.account_owner,
  ae.billing_model,
  h.status AS health_status,
  h.response_time_ms AS health_response_ms,
  h.checked_at AS last_health_check,
  s.plan_name,
  s.quota_limit,
  s.quota_unit,
  s.current_usage,
  s.credits_remaining,
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

-- Seed Anthropic credit snapshot: $7.01 as of 2026-03-25
INSERT INTO credit_snapshots (api_entry_id, balance, snapshot_at, notes)
SELECT id, 7.01, '2026-03-25T22:00:00Z', 'Initial balance from Console screenshot'
FROM api_entries WHERE name = 'Anthropic Claude'
ON CONFLICT (api_entry_id) DO UPDATE SET balance = 7.01, snapshot_at = '2026-03-25T22:00:00Z';
