import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Key,
  Activity,
  DollarSign,
  Bell,
  Calendar,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthStatusBadge } from '@/components/shared/StatusBadge'
import { useDashboardStats, useRecentAlerts } from '@/hooks/useDashboardStats'
import { useApiList } from '@/hooks/useApis'
import { formatCurrency, formatRelativeTime, daysUntil, formatDate } from '@/lib/formatters'

function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  const cards = [
    {
      label: 'Total APIs',
      value: stats?.totalApis ?? 0,
      sub: `${stats?.activeApis ?? 0} active`,
      icon: Key,
      color: 'text-info',
    },
    {
      label: 'Healthy',
      value: stats?.healthyApis ?? 0,
      sub: stats?.unhealthyApis ? `${stats.unhealthyApis} unhealthy` : 'All good',
      icon: Activity,
      color: stats?.unhealthyApis ? 'text-warning' : 'text-success',
    },
    {
      label: 'Monthly Cost',
      value: formatCurrency(stats?.totalMonthlyCost ?? 0),
      sub: `${stats?.upcomingRenewals ?? 0} upcoming renewals`,
      icon: DollarSign,
      color: 'text-success',
    },
    {
      label: 'Active Alerts',
      value: stats?.activeAlerts ?? 0,
      sub: 'Unacknowledged',
      icon: Bell,
      color: (stats?.activeAlerts ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ApiStatusGrid() {
  const { data: apis, isLoading } = useApiList()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const entries = apis ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">API Status Overview</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/apis">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No APIs configured yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((api) => (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{api.name}</p>
                  <p className="text-xs text-muted-foreground">{api.provider}</p>
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-2">
                  <HealthStatusBadge status={api.health_status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingRenewals() {
  const { data: apis, isLoading } = useApiList()

  if (isLoading) return null

  const renewals = (apis ?? [])
    .filter((a) => a.renewal_date)
    .sort((a, b) => new Date(a.renewal_date!).getTime() - new Date(b.renewal_date!).getTime())
    .slice(0, 5)

  if (renewals.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Renewals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {renewals.map((api) => {
            const days = daysUntil(api.renewal_date!)
            const isUrgent = days <= 7
            return (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{api.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(api.renewal_date!)}
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

function RecentAlertsList() {
  const { data: alerts, isLoading } = useRecentAlerts()

  if (isLoading) return null

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No alerts triggered yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Alerts</CardTitle>
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
                  {' '}
                  &middot; {formatRelativeTime(alert.sent_at)}
                </p>
              </div>
              {!alert.acknowledged_at && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  New
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuotaWarnings() {
  const { data: apis, isLoading } = useApiList()

  if (isLoading) return null

  const warnings = (apis ?? [])
    .filter((a) => a.quota_usage_pct !== null && a.quota_usage_pct >= 80)
    .sort((a, b) => (b.quota_usage_pct ?? 0) - (a.quota_usage_pct ?? 0))

  if (warnings.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quota Warnings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {warnings.map((api) => (
            <Link
              key={api.id}
              to={`/apis/${api.id}`}
              className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{api.name}</p>
                <span className={`text-sm font-bold ${
                  api.quota_usage_pct! >= 95 ? 'text-destructive' : 'text-warning'
                }`}>
                  {api.quota_usage_pct}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    api.quota_usage_pct! >= 95 ? 'bg-destructive' : 'bg-warning'
                  }`}
                  style={{ width: `${Math.min(api.quota_usage_pct!, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {api.current_usage?.toLocaleString()} / {api.quota_limit?.toLocaleString()} {api.plan_name}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <ApiStatusGrid />
        <div className="space-y-6">
          <QuotaWarnings />
          <UpcomingRenewals />
          <RecentAlertsList />
        </div>
      </div>
    </div>
  )
}
