import { useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useApiDetail, useCreateApi, useUpdateApi } from '@/hooks/useApis'
import { API_CATEGORIES, API_STATUSES, BILLING_MODELS } from '@/lib/constants'
import type { ApiCategory, ApiStatus, BillingModel } from '@/lib/constants'
import type { ApiEntry } from '@/types/api'

const API_TYPES = [
  { value: 'rest', label: 'REST' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'websocket', label: 'WebSocket' },
  { value: 'sparql', label: 'SPARQL' },
] as const

const HEALTH_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'POST', label: 'POST' },
] as const

interface FormData {
  name: string
  provider: string
  description: string
  docsUrl: string
  baseUrl: string
  healthCheckUrl: string
  healthCheckMethod: 'GET' | 'HEAD' | 'POST'
  apiType: string
  category: ApiCategory
  accountOwner: string
  accountEmail: string
  billingModel: BillingModel
  status: ApiStatus
  notes: string
}

const defaultFormData: FormData = {
  name: '',
  provider: '',
  description: '',
  docsUrl: '',
  baseUrl: '',
  healthCheckUrl: '',
  healthCheckMethod: 'GET',
  apiType: 'rest',
  category: 'other',
  accountOwner: '',
  accountEmail: '',
  billingModel: 'pay_as_you_go',
  status: 'active',
  notes: '',
}

function formDataFromExisting(existing: ApiEntry): FormData {
  return {
    name: existing.name,
    provider: existing.provider,
    description: existing.description ?? '',
    docsUrl: existing.docs_url ?? '',
    baseUrl: existing.base_url ?? '',
    healthCheckUrl: existing.health_check_url ?? '',
    healthCheckMethod: existing.health_check_method,
    apiType: existing.api_type,
    category: existing.category,
    accountOwner: existing.account_owner ?? '',
    accountEmail: existing.account_email ?? '',
    billingModel: existing.billing_model,
    status: existing.status,
    notes: existing.notes ?? '',
  }
}

export default function ApiForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: existing, isLoading: loadingExisting } = useApiDetail(id)
  const createApi = useCreateApi()
  const updateApi = useUpdateApi()

  // While loading existing data, show a spinner.
  // Once loaded, render the form body with a key that forces re-mount,
  // so useState initializers pick up the existing data without useEffect.
  if (isEditing && loadingExisting) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initialData = existing ? formDataFromExisting(existing) : defaultFormData

  return (
    <ApiFormBody
      key={existing ? id : 'new'}
      id={id}
      isEditing={isEditing}
      initialData={initialData}
      createApi={createApi}
      updateApi={updateApi}
      navigate={navigate}
    />
  )
}

function ApiFormBody({
  id,
  isEditing,
  initialData,
  createApi,
  updateApi,
  navigate,
}: {
  id: string | undefined
  isEditing: boolean
  initialData: FormData
  createApi: ReturnType<typeof useCreateApi>
  updateApi: ReturnType<typeof useUpdateApi>
  navigate: ReturnType<typeof useNavigate>
}) {
  const [form, setForm] = useState<FormData>(initialData)

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const isPending = createApi.isPending || updateApi.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const payload = {
      name: form.name,
      provider: form.provider,
      description: form.description || null,
      docs_url: form.docsUrl || null,
      base_url: form.baseUrl || null,
      health_check_url: form.healthCheckUrl || null,
      health_check_method: form.healthCheckMethod,
      api_type: form.apiType as 'rest' | 'graphql' | 'grpc' | 'websocket' | 'sparql',
      category: form.category,
      account_owner: form.accountOwner || null,
      account_email: form.accountEmail || null,
      billing_model: form.billingModel,
      status: form.status,
      notes: form.notes || null,
    }

    if (isEditing && id) {
      await updateApi.mutateAsync({ id, ...payload })
      navigate(`/apis/${id}`)
    } else {
      const created = await createApi.mutateAsync(payload)
      navigate(`/apis/${created.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={isEditing ? `/apis/${id}` : '/apis'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">
        {isEditing ? 'Edit API' : 'Add New API'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. SerpAPI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Input
                  id="provider"
                  value={form.provider}
                  onChange={(e) => setField('provider', e.target.value)}
                  placeholder="e.g. SerpApi LLC"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="What does this API do?"
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>API Type</Label>
                <Select value={form.apiType} onValueChange={(v) => setField('apiType', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setField('category', v as ApiCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(API_CATEGORIES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setField('status', v as ApiStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(API_STATUSES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={form.baseUrl}
                onChange={(e) => setField('baseUrl', e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docsUrl">Documentation URL</Label>
              <Input
                id="docsUrl"
                type="url"
                value={form.docsUrl}
                onChange={(e) => setField('docsUrl', e.target.value)}
                placeholder="https://docs.example.com"
              />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="healthCheckUrl">Health Check URL</Label>
                <Input
                  id="healthCheckUrl"
                  type="url"
                  value={form.healthCheckUrl}
                  onChange={(e) => setField('healthCheckUrl', e.target.value)}
                  placeholder="https://api.example.com/health"
                />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={form.healthCheckMethod} onValueChange={(v) => setField('healthCheckMethod', v as 'GET' | 'HEAD' | 'POST')}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_METHODS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account & Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountOwner">Account Owner</Label>
                <Input
                  id="accountOwner"
                  value={form.accountOwner}
                  onChange={(e) => setField('accountOwner', e.target.value)}
                  placeholder="e.g. roger@predivo.ch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountEmail">Account Email</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  value={form.accountEmail}
                  onChange={(e) => setField('accountEmail', e.target.value)}
                  placeholder="e.g. api@predivo.ch"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Billing Model</Label>
              <Select value={form.billingModel} onValueChange={(v) => setField('billingModel', v as BillingModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BILLING_MODELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to={isEditing ? `/apis/${id}` : '/apis'}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create API'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
