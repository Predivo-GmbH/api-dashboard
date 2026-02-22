export const API_STATUSES = {
  active: { label: 'Active', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
  inactive: { label: 'Inactive', color: 'text-muted-foreground', bg: 'bg-muted' },
  deprecated: { label: 'Deprecated', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  error: { label: 'Error', color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950' },
  rate_limited: { label: 'Rate Limited', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950' },
} as const

export type ApiStatus = keyof typeof API_STATUSES

export const HEALTH_STATUSES = {
  up: { label: 'Up', color: 'text-green-600 dark:text-green-400' },
  down: { label: 'Down', color: 'text-destructive' },
  degraded: { label: 'Degraded', color: 'text-yellow-600 dark:text-yellow-400' },
  timeout: { label: 'Timeout', color: 'text-orange-600 dark:text-orange-400' },
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
