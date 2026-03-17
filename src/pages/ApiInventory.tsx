import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Key, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ApiStatusBadge, HealthStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useApiList } from '@/hooks/useApis'
import { API_CATEGORIES, API_STATUSES } from '@/lib/constants'
import { formatCurrency, daysUntil, formatDate } from '@/lib/formatters'

export default function ApiInventory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const { data: apis, isLoading } = useApiList({
    search: search || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  })

  const hasFilters = search || statusFilter || categoryFilter

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setCategoryFilter('')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6" />
          <h1 className="text-2xl font-bold">APIs</h1>
          {apis && (
            <Badge variant="secondary" className="text-xs">
              {apis.length}
            </Badge>
          )}
        </div>
        <Button asChild>
          <Link to="/apis/new">
            <Plus className="mr-2 h-4 w-4" />
            Add API
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search APIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(API_STATUSES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(API_CATEGORIES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !apis || apis.length === 0 ? (
        <EmptyState
          icon={Key}
          title={hasFilters ? 'No APIs match your filters' : 'No APIs yet'}
          description={
            hasFilters
              ? 'Try adjusting your filters or search term.'
              : 'Add your first API to start managing keys, quotas, and health checks.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link to="/apis/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add API
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apis.map((api) => {
                const renewDays = api.renewal_date ? daysUntil(api.renewal_date) : null
                return (
                  <TableRow key={api.id}>
                    <TableCell>
                      <Link
                        to={`/apis/${api.id}`}
                        className="font-medium hover:underline"
                      >
                        {api.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{api.provider}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {API_CATEGORIES[api.category]?.label ?? api.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ApiStatusBadge status={api.status} />
                    </TableCell>
                    <TableCell>
                      <HealthStatusBadge status={api.health_status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {api.plan_name ?? '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {api.cost_per_period
                        ? formatCurrency(api.cost_per_period)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {api.quota_limit ? (
                        <div className="w-24">
                          <div className="flex justify-between text-xs">
                            <span>{api.quota_usage_pct ?? 0}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${
                                (api.quota_usage_pct ?? 0) >= 95
                                  ? 'bg-destructive'
                                  : (api.quota_usage_pct ?? 0) >= 80
                                    ? 'bg-warning'
                                    : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(api.quota_usage_pct ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {api.renewal_date ? (
                        <span className={renewDays !== null && renewDays <= 7 ? 'font-medium text-destructive' : ''}>
                          {formatDate(api.renewal_date)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
