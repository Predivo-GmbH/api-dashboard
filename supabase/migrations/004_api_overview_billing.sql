-- Add billing_model and quota_unit to v_api_overview for dashboard quota monitoring
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
