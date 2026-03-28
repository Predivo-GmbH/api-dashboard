import { useState } from 'react'
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuditLog } from '@/hooks/useAuditLog'
import { formatDateTime } from '@/lib/formatters'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'credential.created': { label: 'Key Created', color: 'bg-success-subtle text-success' },
  'credential.viewed': { label: 'Key Viewed', color: 'bg-info-subtle text-info' },
  'credential.rotated': { label: 'Key Rotated', color: 'bg-warning-subtle text-warning' },
  'credential.deleted': { label: 'Key Deleted', color: 'bg-error-subtle text-error' },
  'api.created': { label: 'API Created', color: 'bg-success-subtle text-success' },
  'api.updated': { label: 'API Updated', color: 'bg-info-subtle text-info' },
  'api.deleted': { label: 'API Deleted', color: 'bg-error-subtle text-error' },
}

const PAGE_SIZE = 25

export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAuditLog({
    action: actionFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const entries = data?.data ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Audit Log</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
          )}
        </div>
        <Select value={actionFilter || 'all'} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="min-h-[44px] w-full sm:min-h-0 sm:w-[180px]" aria-label="Filter by action type">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <span className="sr-only">Loading audit log...</span>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description={actionFilter ? 'No entries match this filter.' : 'Audit trail will appear as credentials are accessed.'}
        />
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="sm:hidden space-y-3">
            {entries.map((entry) => {
              const actionConfig = ACTION_LABELS[entry.action]
              return (
                <div key={entry.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`text-xs ${actionConfig?.color ?? ''}`}>
                      {actionConfig?.label ?? entry.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                  {entry.target_entity && (
                    <div className="text-sm text-muted-foreground">{entry.target_entity}</div>
                  )}
                  {entry.metadata && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  )}
                  <div className="text-xs text-muted-foreground">
                    IP: {entry.ip_address ?? '-'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table layout */}
          <div className="hidden sm:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap">Target</TableHead>
                  <TableHead className="whitespace-nowrap">Details</TableHead>
                  <TableHead className="whitespace-nowrap">IP</TableHead>
                  <TableHead className="whitespace-nowrap">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const actionConfig = ACTION_LABELS[entry.action]
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className={`text-xs ${actionConfig?.color ?? ''}`}>
                          {actionConfig?.label ?? entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {entry.target_entity && (
                          <span className="text-muted-foreground">
                            {entry.target_entity}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {entry.metadata ? JSON.stringify(entry.metadata) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {entry.ip_address ?? '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDateTime(entry.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} entries)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="size-11" onClick={() => setPage(p => p - 1)} disabled={page <= 1} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-11" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
