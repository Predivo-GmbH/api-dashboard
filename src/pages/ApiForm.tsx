import { useState, useEffect, type FormEvent } from 'react'
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

export default function ApiForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: existing, isLoading: loadingExisting } = useApiDetail(id)
  const createApi = useCreateApi()
  const updateApi = useUpdateApi()

  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [description, setDescription] = useState('')
  const [docsUrl, setDocsUrl] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [healthCheckUrl, setHealthCheckUrl] = useState('')
  const [healthCheckMethod, setHealthCheckMethod] = useState<'GET' | 'HEAD' | 'POST'>('GET')
  const [apiType, setApiType] = useState<string>('rest')
  const [category, setCategory] = useState<ApiCategory>('other')
  const [accountOwner, setAccountOwner] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [billingModel, setBillingModel] = useState<BillingModel>('pay_as_you_go')
  const [status, setStatus] = useState<ApiStatus>('active')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setProvider(existing.provider)
      setDescription(existing.description ?? '')
      setDocsUrl(existing.docs_url ?? '')
      setBaseUrl(existing.base_url ?? '')
      setHealthCheckUrl(existing.health_check_url ?? '')
      setHealthCheckMethod(existing.health_check_method)
      setApiType(existing.api_type)
      setCategory(existing.category)
      setAccountOwner(existing.account_owner ?? '')
      setAccountEmail(existing.account_email ?? '')
      setBillingModel(existing.billing_model)
      setStatus(existing.status)
      setNotes(existing.notes ?? '')
    }
  }, [existing])

  const isPending = createApi.isPending || updateApi.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const payload = {
      name,
      provider,
      description: description || null,
      docs_url: docsUrl || null,
      base_url: baseUrl || null,
      health_check_url: healthCheckUrl || null,
      health_check_method: healthCheckMethod,
      api_type: apiType as 'rest' | 'graphql' | 'grpc' | 'websocket' | 'sparql',
      category,
      account_owner: accountOwner || null,
      account_email: accountEmail || null,
      billing_model: billingModel,
      status,
      notes: notes || null,
    }

    if (isEditing) {
      await updateApi.mutateAsync({ id, ...payload })
      navigate(`/apis/${id}`)
    } else {
      const created = await createApi.mutateAsync(payload)
      navigate(`/apis/${created.id}`)
    }
  }

  if (isEditing && loadingExisting) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SerpAPI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Input
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. SerpApi LLC"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this API do?"
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>API Type</Label>
                <Select value={apiType} onValueChange={setApiType}>
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
                <Select value={category} onValueChange={(v) => setCategory(v as ApiCategory)}>
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
                <Select value={status} onValueChange={(v) => setStatus(v as ApiStatus)}>
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
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docsUrl">Documentation URL</Label>
              <Input
                id="docsUrl"
                type="url"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
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
                  value={healthCheckUrl}
                  onChange={(e) => setHealthCheckUrl(e.target.value)}
                  placeholder="https://api.example.com/health"
                />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={healthCheckMethod} onValueChange={(v) => setHealthCheckMethod(v as 'GET' | 'HEAD' | 'POST')}>
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
                  value={accountOwner}
                  onChange={(e) => setAccountOwner(e.target.value)}
                  placeholder="e.g. roger@predivo.ch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountEmail">Account Email</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="e.g. api@predivo.ch"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Billing Model</Label>
              <Select value={billingModel} onValueChange={(v) => setBillingModel(v as BillingModel)}>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
