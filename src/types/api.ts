import type { ApiStatus, ApiCategory, BillingModel, HealthStatus } from '@/lib/constants'

export interface ApiEntry {
  id: string
  name: string
  provider: string
  description: string | null
  docs_url: string | null
  base_url: string | null
  health_check_url: string | null
  health_check_method: 'GET' | 'HEAD' | 'POST'
  api_type: 'rest' | 'graphql' | 'grpc' | 'websocket' | 'sparql'
  category: ApiCategory
  account_owner: string | null
  account_email: string | null
  billing_model: BillingModel
  status: ApiStatus
  notes: string | null
  created_at: string
  updated_at: string
  api_project_assignments?: ApiProjectAssignment[]
  api_credentials?: ApiCredentialMeta[]
  subscriptions?: Subscription[]
  alert_settings?: AlertSetting[]
}

export interface ApiCredentialMeta {
  id: string
  label: string
  key_hint: string
  is_active: boolean
  created_at: string
  rotated_at: string | null
  expires_at: string | null
}

export interface Subscription {
  id: string
  api_entry_id: string
  plan_name: string
  billing_cycle: 'monthly' | 'annual' | 'one_time' | 'none'
  cost_per_period: number
  currency: string
  renewal_date: string | null
  quota_limit: number | null
  quota_unit: string
  current_usage: number
  auto_renew: boolean
  created_at: string
  updated_at: string
}

export interface ApiOverview {
  id: string
  name: string
  provider: string
  category: ApiCategory
  status: ApiStatus
  account_owner: string | null
  health_status: HealthStatus | null
  health_response_ms: number | null
  last_health_check: string | null
  plan_name: string | null
  quota_limit: number | null
  current_usage: number | null
  renewal_date: string | null
  cost_per_period: number | null
  quota_usage_pct: number | null
}

export interface ApiProjectAssignment {
  id: string
  api_entry_id: string
  project_id: string
  env_var_name: string | null
  notes: string | null
  created_at: string
  projects?: Project
}

export interface AlertSetting {
  id: string
  api_entry_id: string
  alert_type: string
  threshold: number | null
  email_recipients: string[]
  enabled: boolean
  last_triggered_at: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  color: string | null
  created_at: string
  updated_at: string
}

export interface HealthCheck {
  id: string
  api_entry_id: string
  status: HealthStatus
  response_time_ms: number | null
  status_code: number | null
  error_message: string | null
  checked_at: string
}

export interface UsageRecord {
  id: string
  api_entry_id: string
  project_id: string | null
  period_start: string
  period_end: string
  call_count: number
  credits_used: number | null
  cost: number
  currency: string
  source: 'manual' | 'auto_fetch' | 'api_import'
  metadata: Record<string, unknown> | null
  recorded_at: string
}

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  target_entity: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface TriggeredAlert {
  id: string
  alert_setting_id: string
  api_entry_id: string
  message: string
  recipients: string[]
  sent_at: string
  acknowledged_at: string | null
}
