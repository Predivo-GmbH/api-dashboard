import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Zap,
  Bell,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats, useRecentAlerts } from '@/hooks/useDashboardStats'
import { useSyncUsage } from '@/hooks/useSyncUsage'
import { useLastSyncTime } from '@/hooks/useUsageRecords'
import {
  formatCurrency,
  formatRelativeTime,
  formatNumber,
  estimateDaysLeft,
} from '@/lib/formatters'

// ── Stat Cards ──────────────────────────────────────────────
function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
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
  const urgent = stats?.mostUrgent

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Credits Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Credits Status</p>
            <ShieldAlert className={`h-4 w-4 ${runningLow > 0 ? 'text-destructive' : 'text-emerald-500'}`} />
          </div>
          <p className={`mt-2 text-2xl font-bold ${runningLow > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
            {runningLow > 0 ? `${runningLow} running low` : 'All good'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.balances.length ?? 0} APIs with live balance tracking
          </p>
        </CardContent>
      </Card>

      {/* Most Urgent */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Most Urgent</p>
            <TrendingDown className={`h-4 w-4 ${runningLow > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          </div>
          {urgent ? (
            <>
              <p className="mt-2 text-2xl font-bold">
                {urgent.name === 'Anthropic Claude'
                  ? formatCurrency(urgent.credits_remaining)
                  : `${formatNumber(urgent.credits_remaining)} left`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {urgent.name}
                {(() => {
                  const days = estimateDaysLeft(urgent.current_usage, urgent.credits_remaining)
                  return days !== null ? ` — ~${days} days left` : ''
                })()}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold text-muted-foreground">&mdash;</p>
              <p className="mt-1 text-xs text-muted-foreground">No tracked balances yet</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Credit Balances (main section) ──────────────────────────
function CreditBalances() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const balances = stats?.balances ?? []

  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No balance data yet. Click &ldquo;Sync Now&rdquo; to fetch live data.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Credit Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {balances.map((api) => {
            const isDollar = api.name === 'Anthropic Claude'
            const remaining = api.credits_remaining
            const used = api.current_usage
            // Only show total if it's a real quota (sync updates it from live API)
            const hasRealQuota = api.quota_limit && api.quota_limit > 0 && used > 0
            const total = hasRealQuota ? api.quota_limit! : null

            // Percentage remaining
            let pctRemaining: number
            if (total) {
              pctRemaining = Math.min(100, Math.max(0, (remaining / total) * 100))
            } else {
              // No total available — can't compute percentage
              // Use a simple heuristic: treat remaining as healthy unless very low
              pctRemaining = remaining > 0 ? 70 : 0
            }

            // Burn rate — only works when we have meaningful usage data
            const daysLeft = hasRealQuota ? estimateDaysLeft(used, remaining) : null

            // Color tiers
            let barColor: string
            let borderColor: string
            let textColor: string
            if (pctRemaining <= 20) {
              barColor = 'bg-destructive'
              borderColor = 'border-destructive/20 bg-destructive/5'
              textColor = 'text-destructive'
            } else if (pctRemaining <= 50) {
              barColor = 'bg-amber-500'
              borderColor = 'border-amber-500/20 bg-amber-500/5'
              textColor = 'text-amber-600'
            } else {
              barColor = 'bg-emerald-500'
              borderColor = ''
              textColor = 'text-emerald-600'
            }

            // Format the remaining value
            const unit = (api.quota_unit ?? 'credits').replace(/\/month|\/day/g, '').trim()
            const remainingLabel = isDollar
              ? `${formatCurrency(remaining)} remaining`
              : `${formatNumber(remaining)} ${unit} left`

            // Burn rate label
            let burnLabel: string
            if (daysLeft !== null) {
              burnLabel = daysLeft === 0 ? 'Depleted' : `Lasts ~${daysLeft} days at current rate`
            } else if (isDollar) {
              burnLabel = 'Updated every sync from Cost Report API'
            } else if (!hasRealQuota) {
              burnLabel = 'No usage rate data yet'
            } else {
              burnLabel = 'Not enough data for projection'
            }

            return (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className={`block rounded-lg border p-4 transition-colors hover:bg-muted/50 ${borderColor}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{api.name}</p>
                    <p className="text-xs text-muted-foreground">{api.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${textColor}`}>
                      {remainingLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{burnLabel}</p>
                  </div>
                </div>

                {/* Progress bar — only show when we have a real total */}
                {total && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pctRemaining}%` }}
                    />
                  </div>
                )}

                {/* Context line — only when total is known from live API */}
                {total && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(used)} used of {formatNumber(total)} this month
                  </p>
                )}
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
          <div className="flex items-center gap-2 text-sm text-emerald-500">
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
            {syncUsage.isPending ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      <StatsCards />

      <CreditBalances />

      <ActiveAlerts />
    </div>
  )
}
