import { Badge } from '@/components/ui/badge'
import { API_STATUSES, HEALTH_STATUSES, type ApiStatus, type HealthStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const config = API_STATUSES[status]
  return (
    <Badge variant="secondary" className={cn('font-medium', config.color, config.bg)}>
      {config.label}
    </Badge>
  )
}

export function HealthStatusBadge({ status }: { status: HealthStatus | null }) {
  if (!status) {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        No data
      </Badge>
    )
  }
  const config = HEALTH_STATUSES[status]
  return (
    <Badge variant="secondary" className={cn('font-medium', config.color)}>
      {config.label}
    </Badge>
  )
}
