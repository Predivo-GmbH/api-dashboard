import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Plus, Eye, EyeOff, Copy, KeyRound,
  ExternalLink, Shield, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useApiDetail, useDeleteApi } from '@/hooks/useApis'
import { useEncryptCredential, useDecryptCredential, useDeactivateCredential, useDeleteCredential } from '@/hooks/useCredentials'
import { API_CATEGORIES, BILLING_MODELS, ALERT_TYPES } from '@/lib/constants'
import { formatDate, formatDateTime, formatCurrency, formatRelativeTime, maskSecret, daysUntil } from '@/lib/formatters'
import type { ApiCredentialMeta, Subscription, ApiProjectAssignment, AlertSetting } from '@/types/api'
import { toast } from 'sonner'

// ─── Credential Manager ────────────────────────────────────────────────────────

function CredentialManager({ apiId, credentials }: { apiId: string; credentials: ApiCredentialMeta[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [label, setLabel] = useState('default')
  const [plaintextKey, setPlaintextKey] = useState('')
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const encrypt = useEncryptCredential()
  const decrypt = useDecryptCredential()
  const deactivate = useDeactivateCredential()
  const deleteCred = useDeleteCredential()

  async function handleAdd() {
    if (!plaintextKey.trim()) return
    await encrypt.mutateAsync({
      api_entry_id: apiId,
      label,
      plaintext_key: plaintextKey,
    })
    setAddOpen(false)
    setLabel('default')
    setPlaintextKey('')
  }

  async function handleReveal(id: string) {
    const key = await decrypt.mutateAsync(id)
    setRevealedId(id)
    setRevealedKey(key)
    setTimeout(() => {
      setRevealedId(null)
      setRevealedKey(null)
    }, 30000)
  }

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">API Keys</h3>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Key
        </Button>
      </div>

      {credentials.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No credentials"
          description="Add an API key to store it securely."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Key
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{cred.label}</p>
                  {!cred.is_active && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                  {cred.expires_at && daysUntil(cred.expires_at) <= 30 && (
                    <Badge variant="destructive" className="text-xs">
                      Expires {daysUntil(cred.expires_at)}d
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {revealedId === cred.id && revealedKey ? (
                    <code className="rounded bg-muted px-2 py-0.5 text-xs break-all">
                      {revealedKey}
                    </code>
                  ) : (
                    <code className="text-xs text-muted-foreground">
                      {maskSecret(cred.key_hint)}
                    </code>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span>Added {formatDate(cred.created_at)}</span>
                  {cred.rotated_at && (
                    <>
                      <span className="hidden sm:inline"> · </span>
                      <br className="sm:hidden" />
                      <span>Rotated {formatDate(cred.rotated_at)}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-1 w-full sm:w-auto">
                {revealedId === cred.id && revealedKey ? (
                  <>
                    <Button variant="ghost" size="icon" className="size-11" onClick={() => handleCopy(revealedKey)} aria-label="Copy API key">
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-11" onClick={() => { setRevealedId(null); setRevealedKey(null) }} aria-label="Hide API key">
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost" size="icon" className="size-11"
                    onClick={() => handleReveal(cred.id)}
                    disabled={decrypt.isPending}
                    aria-label="Reveal API key"
                  >
                    {decrypt.isPending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                )}
                {cred.is_active && (
                  <Button variant="ghost" size="icon" className="size-11"
                    onClick={() => deactivate.mutate({ id: cred.id, api_entry_id: apiId })}
                    aria-label="Deactivate credential"
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="size-11 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(cred.id)}
                  aria-label="Delete credential"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>The key will be encrypted with AES-256-GCM before storage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cred-label">Label</Label>
              <Input id="cred-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. production, backup" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-key">API Key</Label>
              <Input id="cred-key" type="password" value={plaintextKey} onChange={(e) => setPlaintextKey(e.target.value)} placeholder="Paste your API key" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={encrypt.isPending || !plaintextKey.trim()}>
              {encrypt.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Encrypting...</> : 'Add Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Credential"
        description="This will permanently delete this API key. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteCred.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCred.mutate({ id: deleteTarget, api_entry_id: apiId })
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}

// ─── Subscription Card ──────────────────────────────────────────────────────────

function SubscriptionInfo({ subscriptions }: { subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) {
    return <p className="text-sm text-muted-foreground">No subscription data.</p>
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => {
        const quotaPct = sub.quota_limit && sub.quota_limit > 0
          ? Math.round((sub.current_usage / sub.quota_limit) * 100)
          : null

        return (
          <Card key={sub.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{sub.plan_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {BILLING_MODELS[sub.billing_cycle as keyof typeof BILLING_MODELS] ?? sub.billing_cycle}
                    {sub.cost_per_period > 0 && ` · ${formatCurrency(sub.cost_per_period, sub.currency)}`}
                  </p>
                </div>
                {sub.auto_renew && <Badge variant="outline" className="shrink-0 text-xs">Auto-renew</Badge>}
              </div>
              {sub.quota_limit && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{sub.current_usage.toLocaleString()} / {sub.quota_limit.toLocaleString()} {sub.quota_unit}</span>
                    <span>{quotaPct}%</span>
                  </div>
                  <div
                    className="mt-1 h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={quotaPct ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${sub.plan_name} quota usage`}
                  >
                    <div
                      className={`h-full rounded-full ${(quotaPct ?? 0) >= 95 ? 'bg-destructive' : (quotaPct ?? 0) >= 80 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${Math.min(quotaPct ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {sub.renewal_date && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Next renewal: {formatDate(sub.renewal_date)} ({daysUntil(sub.renewal_date)} days)
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Project Assignments ────────────────────────────────────────────────────────

function ProjectAssignments({ assignments }: { assignments: ApiProjectAssignment[] }) {
  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">Not assigned to any projects.</p>
  }

  return (
    <div className="space-y-2">
      {assignments.map((a) => {
        const project = a.projects
        return (
          <Link key={a.id} to={`/projects/${a.project_id}`}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            {project?.color && (
              <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{project?.name ?? a.project_id}</p>
              {a.env_var_name && <code className="text-xs text-muted-foreground">{a.env_var_name}</code>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ─── Alert Settings ─────────────────────────────────────────────────────────────

function AlertSettingsList({ alerts }: { alerts: AlertSetting[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-muted-foreground">No alerts configured for this API.</p>
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = ALERT_TYPES[alert.alert_type as keyof typeof ALERT_TYPES]
        return (
          <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{config?.label ?? alert.alert_type}</p>
              <p className="text-xs text-muted-foreground">
                {config?.description}
                {alert.threshold && ` (threshold: ${alert.threshold})`}
              </p>
            </div>
            <Badge variant={alert.enabled ? 'default' : 'secondary'} className="shrink-0">
              {alert.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ApiDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: api, isLoading } = useApiDetail(id)
  const deleteApi = useDeleteApi()
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6" role="status" aria-live="polite">
        <span className="sr-only">Loading API details...</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!api) {
    return (
      <div className="p-4 sm:p-6" role="alert">
        <p className="text-muted-foreground">API not found.</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/apis"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Back to APIs</Link>
        </Button>
      </div>
    )
  }

  const categoryConfig = API_CATEGORIES[api.category]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/apis"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Back to APIs</Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{api.name}</h1>
              <ApiStatusBadge status={api.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {api.provider}
              {categoryConfig && ` · ${categoryConfig.label}`}
              {api.api_type && ` · ${api.api_type.toUpperCase()}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/apis/${id}/edit`}><Edit className="mr-2 h-3 w-3" />Edit</Link>
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-3 w-3" />Delete
            </Button>
          </div>
        </div>
      </div>

      {(api.description || api.docs_url || api.base_url) && (
        <Card>
          <CardContent className="space-y-2 p-4">
            {api.description && <p className="text-sm">{api.description}</p>}
            <div className="flex flex-wrap gap-3">
              {api.docs_url && (
                <a href={api.docs_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />Documentation
                </a>
              )}
              {api.base_url && <code className="break-all rounded bg-muted px-2 py-0.5 text-xs">{api.base_url}</code>}
            </div>
            {api.account_owner && (
              <p className="text-xs text-muted-foreground">
                Owner: {api.account_owner}{api.account_email && ` (${api.account_email})`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="credentials">
        <TabsList variant="line" className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="credentials">
            Credentials
            {api.api_credentials && api.api_credentials.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{api.api_credentials.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="projects">
            Projects
            {api.api_project_assignments && api.api_project_assignments.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{api.api_project_assignments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="mt-4">
          <CredentialManager apiId={api.id} credentials={api.api_credentials ?? []} />
        </TabsContent>
        <TabsContent value="subscription" className="mt-4">
          <SubscriptionInfo subscriptions={api.subscriptions ?? []} />
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <ProjectAssignments assignments={api.api_project_assignments ?? []} />
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          {api.health_check_url ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Health check endpoint: <code className="break-all rounded bg-muted px-1">{api.health_check_url}</code> ({api.health_check_method})
              </p>
              <p className="text-sm text-muted-foreground">Health check history will appear here once the health-check-runner is deployed.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No health check URL configured. Edit this API to add one.</p>
          )}
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <AlertSettingsList alerts={api.alert_settings ?? []} />
        </TabsContent>
      </Tabs>

      {api.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{api.notes}</p></CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:gap-4">
        <span>Created {formatDateTime(api.created_at)}</span>
        <span>Updated {formatRelativeTime(api.updated_at)}</span>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${api.name}?`}
        description="This will permanently delete this API entry, all its credentials, subscriptions, and health check history. This cannot be undone."
        confirmLabel="Delete API"
        variant="destructive"
        loading={deleteApi.isPending}
        onConfirm={async () => {
          await deleteApi.mutateAsync(api.id)
          navigate('/apis')
        }}
      />
    </div>
  )
}
