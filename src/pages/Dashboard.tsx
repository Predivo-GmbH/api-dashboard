import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldAlert,
  Gauge,
  CreditCard,
  Bell,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats, useRecentAlerts } from '@/hooks/useDashboardStats'
import { useApiList } from '@/hooks/useApis'
import { useSyncUsage } from '@/hooks/useSyncUsage'
import { useCurrentMonthUsage, useLastSyncTime } from '@/hooks/useUsageRecords'
import {
  formatCurrency,
  formatRelativeTime,
  formatRemaining,
  formatNumber,
  estimateRunOut,
  daysUntil,
  daysUntilEndOfMonth,
  formatDate,
} from '@/lib/formatters'

// ── Stat Cards ──────────────────────────────────────────────
function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const runningLow = stats?.apisRunningLow ?? 0
  const lowest = stats?.lowestRemaining

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Running Low */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Running Low</p>
            <ShieldAlert className={`h-4 w-4 ${runningLow > 0 ? 'text-destructive' : 'text-success'}`} />
          </div>
          <p className={`mt-2 text-2xl font-bold ${runningLow > 0 ? 'text-destructive' : 'text-success'}`}>
            {runningLow}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {runningLow === 0 ? 'All quotas healthy' : `API${runningLow > 1 ? 's' : ''} at 70%+ usage`}
          </p>
        </CardContent>
      </Card>

      {/* Lowest Remaining */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Lowest Remaining</p>
            <Gauge className={`h-4 w-4 ${lowest && lowest.pct >= 70 ? 'text-warning' : 'text-muted-foreground'}`} />
          </div>
          {lowest ? (
            <>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(lowest.remaining)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lowest.name} &mdash; {lowest.unit.replace(/\/month|\/day/g, '').trim()}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold text-muted-foreground">&mdash;</p>
              <p className="mt-1 text-xs text-muted-foreground">No quota-limited APIs</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pay-as-you-go */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Pay-as-you-go</p>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(stats?.payAsYouGoSpend ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.payAsYouGoCount ?? 0} API{(stats?.payAsYouGoCount ?? 0) !== 1 ? 's' : ''} without limits this month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Quota Status (main section) ─────────────────────────────
function QuotaStatus() {
  const { data: apis, isLoading: apisLoading } = useApiList()
  const { data: usage, isLoading: usageLoading } = useCurrentMonthUsage()

  if (apisLoading || usageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quota Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const entries = apis ?? []
  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const daysLeft = daysUntilEndOfMonth()

  // APIs with quotas — sorted by usage % descending (worst first)
  const quotaApis = entries
    .filter(a => a.quota_limit && a.quota_limit > 0)
    .map(a => {
      const used = a.current_usage ?? 0
      const remaining = a.quota_limit! - used
      const pct = a.quota_usage_pct ?? 0
      const runOut = estimateRunOut(used, a.quota_limit!, periodStart)
      return { ...a, remaining, pct, runOut }
    })
    .sort((a, b) => b.pct - a.pct)

  // Pay-as-you-go APIs — from usage_records
  const usageMap = new Map(
    (usage ?? []).map(u => [u.api_entry_id, u])
  )
  const payAsYouGo = entries
    .filter(a => a.billing_model === 'pay_as_you_go' && (!a.quota_limit || a.quota_limit === 0))
    .map(a => ({ ...a, usageRecord: usageMap.get(a.id) }))
    .sort((a, b) => Number(b.usageRecord?.cost ?? 0) - Number(a.usageRecord?.cost ?? 0))

  if (quotaApis.length === 0 && payAsYouGo.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quota Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No usage data yet. Click &ldquo;Sync Now&rdquo; to fetch live data.
          </p>
        </CardContent>
      </Card>
    )
  }

  function tierColor(pct: number) {
    if (pct >= 90) return { bar: 'bg-destructive', bg: 'border-destructive/20 bg-destructive/5', text: 'text-destructive' }
    if (pct >= 70) return { bar: 'bg-warning', bg: 'border-warning/20 bg-warning/5', text: 'text-warning' }
    return { bar: 'bg-primary', bg: '', text: 'text-primary' }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quota Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Quota-limited APIs */}
          {quotaApis.map((api) => {
            const colors = tierColor(api.pct)
            return (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className={`block rounded-lg border p-4 transition-colors hover:bg-muted/50 ${colors.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{api.name}</p>
                    <p className="text-xs text-muted-foreground">{api.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${colors.text}`}>
                      {formatRemaining(api.remaining, api.quota_unit ?? 'credits')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysLeft}d until reset
                      {api.runOut && (
                        <span className="ml-1 text-destructive">&middot; {api.runOut}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${Math.min(api.pct, 100)}%` }}
                  />
                </div>
              </Link>
            )
          })}

          {/* Pay-as-you-go APIs */}
          {payAsYouGo.length > 0 && quotaApis.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pay-as-you-go
              </p>
            </div>
          )}
          {payAsYouGo.map((api) => {
            const record = api.usageRecord
            const meta = record?.metadata ?? {}
            const cost = Number(record?.cost ?? 0)

            return (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{api.name}</p>
                    <p className="text-xs text-muted-foreground">{api.provider}</p>
                  </div>
                  <div className="text-right">
                    {cost > 0 ? (
                      <p className="text-sm font-bold">{formatCurrency(cost)}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No spend yet</p>
                    )}
                    <Badge variant="secondary" className="mt-1 text-xs">
                      No limit
                    </Badge>
                  </div>
                </div>
                {/* Anthropic token breakdown */}
                {api.name === 'Anthropic Claude' && Number(meta.total_input_tokens ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>In: {formatNumber(Number(meta.total_input_tokens))} tokens</span>
                    <span>Out: {formatNumber(Number(meta.total_output_tokens ?? 0))} tokens</span>
                    {Number(meta.total_cache_read_tokens ?? 0) > 0 && (
                      <span>Cache: {formatNumber(Number(meta.total_cache_read_tokens))} tokens</span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Upcoming Resets & Renewals ───────────────────────────────
function UpcomingRenewals() {
  const { data: apis, isLoading } = useApiList()

  if (isLoading) return null

  const fourteenDays = new Date()
  fourteenDays.setDate(fourteenDays.getDate() + 14)

  const renewals = (apis ?? [])
    .filter((a) => a.renewal_date && new Date(a.renewal_date) <= fourteenDays)
    .sort((a, b) => new Date(a.renewal_date!).getTime() - new Date(b.renewal_date!).getTime())

  if (renewals.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Resets & Renewals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {renewals.map((api) => {
            const days = daysUntil(api.renewal_date!)
            const isUrgent = days <= 3
            const hasQuota = api.quota_limit && api.quota_limit > 0
            return (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{api.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasQuota
                      ? `${(api.current_usage ?? 0).toLocaleString()}/${api.quota_limit!.toLocaleString()} used`
                      : formatDate(api.renewal_date!)}
                  </p>
                </div>
                <Badge
                  variant={isUrgent ? 'destructive' : 'secondary'}
                  className="shrink-0"
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  {days <= 0 ? 'Overdue' : `${days}d`}
                </Badge>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Active Alerts ────────────────────────────────────────────
function ActiveAlerts() {
  const { data: alerts, isLoading } = useRecentAlerts()

  if (isLoading) return null

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-success">
            <Bell className="h-4 w-4" />
            No active alerts
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {(alert as { api_entries?: { name?: string } }).api_entries?.name ?? ''}
                  {' '}&middot; {formatRelativeTime(alert.sent_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const syncUsage = useSyncUsage()
  const { data: lastSync } = useLastSyncTime()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              <Zap className="mr-1 inline h-3 w-3" />
              Synced {formatRelativeTime(lastSync)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncUsage.mutate()}
            disabled={syncUsage.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncUsage.isPending ? 'animate-spin' : ''}`} />
            {syncUsage.isPending ? 'Syncing…' : 'Sync Now'}
          </Button>
        </div>
      </div>

      <StatsCards />

      <QuotaStatus />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingRenewals />
        <ActiveAlerts />
      </div>
    </div>
  )
}
