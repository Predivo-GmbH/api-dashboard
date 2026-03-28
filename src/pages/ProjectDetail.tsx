import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProjectDetail, useAssignApi, useUnassignApi } from '@/hooks/useProjects'
import { useApiList } from '@/hooks/useApis'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { API_CATEGORIES } from '@/lib/constants'
import type { ProjectAssignmentWithApi } from '@/types/api'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading } = useProjectDetail(id)
  const { data: allApis } = useApiList()
  const assignApi = useAssignApi()
  const unassignApi = useUnassignApi()

  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedApiId, setSelectedApiId] = useState('')
  const [envVarName, setEnvVarName] = useState('')
  const [removeTarget, setRemoveTarget] = useState<{ id: string; api_entry_id: string; name: string } | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6" role="status" aria-live="polite">
        <span className="sr-only">Loading project details...</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 sm:p-6" role="alert">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Back to Projects</Link>
        </Button>
      </div>
    )
  }

  const projectId = project.id
  const assignedApiIds = new Set(project.assignments.map((a: { api_entry_id: string }) => a.api_entry_id))
  const availableApis = (allApis ?? []).filter((a) => !assignedApiIds.has(a.id))

  async function handleAssign() {
    if (!selectedApiId) return
    await assignApi.mutateAsync({
      api_entry_id: selectedApiId,
      project_id: projectId,
      env_var_name: envVarName || null,
      notes: null,
    })
    setAssignOpen(false)
    setSelectedApiId('')
    setEnvVarName('')
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Back to Projects</Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: project.color ?? 'var(--color-muted-foreground)' }} aria-hidden="true" />
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Assigned APIs</p>
            <p className="text-2xl font-bold">{project.assignments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Cost (usage)</p>
            <p className="text-2xl font-bold">{formatCurrency(project.totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-xl font-bold sm:text-2xl">{formatDate(project.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Assigned APIs</CardTitle>
          <Button size="sm" onClick={() => setAssignOpen(true)} disabled={availableApis.length === 0}>
            <Plus className="mr-1 h-3 w-3" />Assign API
          </Button>
        </CardHeader>
        <CardContent>
          {project.assignments.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No APIs assigned"
              description="Assign APIs to this project to track which keys and services it uses."
              action={
                <Button size="sm" onClick={() => setAssignOpen(true)} disabled={availableApis.length === 0}>
                  <Plus className="mr-1 h-3 w-3" />Assign API
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {project.assignments.map((a: ProjectAssignmentWithApi) => {
                const api = a.api_entries?.[0]
                return (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <Link to={`/apis/${a.api_entry_id}`} className="min-w-0 hover:underline">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{api?.name ?? a.api_entry_id}</p>
                        {api?.status ? <ApiStatusBadge status={api.status} /> : null}
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {api?.provider ? <span>{api.provider}</span> : null}
                        {api?.category ? (
                          <Badge variant="outline" className="text-xs">
                            {API_CATEGORIES[api.category]?.label ?? api.category}
                          </Badge>
                        ) : null}
                        {a.env_var_name ? <code>{a.env_var_name}</code> : null}
                      </div>
                    </Link>
                    <Button
                      variant="ghost" size="icon"
                      className="size-11 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setRemoveTarget({
                        id: a.id,
                        api_entry_id: a.api_entry_id,
                        name: api?.name ?? 'this API',
                      })}
                      aria-label={`Remove ${api?.name ?? 'API'} from project`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate">Assign API to {project.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API</Label>
              <Select value={selectedApiId} onValueChange={setSelectedApiId}>
                <SelectTrigger aria-label="Select an API"><SelectValue placeholder="Select an API" /></SelectTrigger>
                <SelectContent>
                  {availableApis.map((api) => (
                    <SelectItem key={api.id} value={api.id}>{api.name} ({api.provider})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-var">Environment Variable Name</Label>
              <Input id="env-var" value={envVarName} onChange={(e) => setEnvVarName(e.target.value)} placeholder="e.g. SERPAPI_API_KEY" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assignApi.isPending || !selectedApiId}>
              {assignApi.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</> : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.name}?`}
        description="This will unassign the API from this project. The API entry itself won't be deleted."
        confirmLabel="Remove"
        variant="destructive"
        loading={unassignApi.isPending}
        onConfirm={() => {
          if (removeTarget) {
            unassignApi.mutate({ id: removeTarget.id, project_id: projectId, api_entry_id: removeTarget.api_entry_id })
            setRemoveTarget(null)
          }
        }}
      />
    </div>
  )
}
