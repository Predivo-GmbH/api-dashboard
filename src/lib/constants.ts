export const API_STATUSES = {
  active: { label: 'Active', color: 'text-success', bg: 'bg-success-subtle' },
  inactive: { label: 'Inactive', color: 'text-muted-foreground', bg: 'bg-muted' },
  deprecated: { label: 'Deprecated', color: 'text-warning', bg: 'bg-warning-subtle' },
  error: { label: 'Error', color: 'text-destructive', bg: 'bg-error-subtle' },
  rate_limited: { label: 'Rate Limited', color: 'text-warning', bg: 'bg-warning-subtle' },
} as const

export type ApiStatus = keyof typeof API_STATUSES

export const HEALTH_STATUSES = {
  up: { label: 'Up', color: 'text-success' },
  down: { label: 'Down', color: 'text-destructive' },
  degraded: { label: 'Degraded', color: 'text-warning' },
  timeout: { label: 'Timeout', color: 'text-warning' },
  unknown: { label: 'Unknown', color: 'text-muted-foreground' },
} as const

export type HealthStatus = keyof typeof HEALTH_STATUSES

export const API_CATEGORIES = {
  search: { label: 'Search', icon: 'Search' },
  scraping: { label: 'Scraping', icon: 'Globe' },
  ai: { label: 'AI / ML', icon: 'Brain' },
  email: { label: 'Email', icon: 'Mail' },
  payment: { label: 'Payment', icon: 'CreditCard' },
  analytics: { label: 'Analytics', icon: 'BarChart3' },
  storage: { label: 'Storage', icon: 'Database' },
  auth: { label: 'Authentication', icon: 'Shield' },
  maps: { label: 'Maps', icon: 'MapPin' },
  other: { label: 'Other', icon: 'Puzzle' },
} as const

export type ApiCategory = keyof typeof API_CATEGORIES

export const BILLING_MODELS = {
  free: 'Free',
  pay_as_you_go: 'Pay-as-you-go',
  monthly_subscription: 'Monthly',
  annual_subscription: 'Annual',
  one_time: 'One-time',
  freemium: 'Freemium',
} as const

export type BillingModel = keyof typeof BILLING_MODELS

export const ALERT_TYPES = {
  quota_warning: { label: 'Quota Warning', description: 'When quota usage exceeds threshold %' },
  quota_critical: { label: 'Quota Critical', description: 'When quota usage is nearly exhausted' },
  renewal_reminder: { label: 'Renewal Reminder', description: 'Days before next renewal' },
  health_alert: { label: 'Health Alert', description: 'When API health check fails' },
  cost_threshold: { label: 'Cost Threshold', description: 'When monthly cost exceeds amount' },
  key_expiration: { label: 'Key Expiration', description: 'Days before API key expires' },
} as const

export type AlertType = keyof typeof ALERT_TYPES
