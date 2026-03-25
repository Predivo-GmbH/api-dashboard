import { handleCors, createJsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { logAudit } from '../_shared/auditLogger.ts'

interface ProviderResult {
  provider: string
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

// ── SerpAPI ─────────────────────────────────────────────────
async function fetchSerpApiUsage(): Promise<ProviderResult> {
  const key = Deno.env.get('SERPAPI_API_KEY')
  if (!key) return { provider: 'SerpAPI', success: false, error: 'No API key configured' }

  const res = await fetch(`https://serpapi.com/account.json?api_key=${key}`)
  if (!res.ok) return { provider: 'SerpAPI', success: false, error: `HTTP ${res.status}` }

  const data = await res.json()
  return {
    provider: 'SerpAPI',
    success: true,
    data: {
      plan_name: data.plan_name,
      searches_per_month: data.searches_per_month,
      this_month_usage: data.this_month_usage,
      plan_searches_left: data.plan_searches_left,
      total_searches_left: data.total_searches_left,
      extra_credits: data.extra_credits,
      last_hour_searches: data.last_hour_searches,
      account_email: data.account_email,
    },
  }
}

// ── Firecrawl ───────────────────────────────────────────────
async function fetchFirecrawlUsage(): Promise<ProviderResult> {
  const key = Deno.env.get('FIRECRAWL_API_KEY')
  if (!key) return { provider: 'Firecrawl', success: false, error: 'No API key configured' }

  const res = await fetch('https://api.firecrawl.dev/v1/team/credit-usage', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return { provider: 'Firecrawl', success: false, error: `HTTP ${res.status}` }

  const raw = await res.json()
  // Firecrawl nests data under .data or returns flat — handle both
  const data = raw.data ?? raw
  return {
    provider: 'Firecrawl',
    success: true,
    data: {
      remaining_credits: data.remaining_credits ?? data.remainingCredits ?? data.credits_remaining,
      plan_credits: data.plan_credits ?? data.planCredits ?? data.total_credits,
      billing_period_start: data.billing_period_start ?? data.billingPeriodStart,
      billing_period_end: data.billing_period_end ?? data.billingPeriodEnd,
      raw,
    },
  }
}

// ── Anthropic ───────────────────────────────────────────────
async function fetchAnthropicUsage(): Promise<ProviderResult> {
  const key = Deno.env.get('ANTHROPIC_ADMIN_KEY')
  if (!key) return { provider: 'Anthropic', success: false, error: 'No admin API key configured' }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Fetch all pages of usage data for the current month
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCacheCreationTokens = 0
  let totalCacheReadTokens = 0
  let nextPage: string | null = null
  let pageCount = 0

  do {
    const params = new URLSearchParams({
      starting_at: startOfMonth.toISOString(),
      ending_at: endOfMonth.toISOString(),
      bucket_width: '1d',
    })
    if (nextPage) params.set('page', nextPage)

    const res = await fetch(
      `https://api.anthropic.com/v1/organizations/usage_report/messages?${params}`,
      {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
      },
    )
    if (!res.ok) {
      const body = await res.text()
      return { provider: 'Anthropic', success: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` }
    }

    const data = await res.json()

    if (Array.isArray(data.data)) {
      for (const bucket of data.data) {
        for (const result of (bucket.results ?? [])) {
          totalInputTokens += result.uncached_input_tokens ?? 0
          totalOutputTokens += result.output_tokens ?? 0
          totalCacheCreationTokens += (result.cache_creation?.ephemeral_1h_input_tokens ?? 0)
            + (result.cache_creation?.ephemeral_5m_input_tokens ?? 0)
          totalCacheReadTokens += result.cache_read_input_tokens ?? 0
        }
      }
    }

    nextPage = data.has_more ? data.next_page : null
    pageCount++
  } while (nextPage && pageCount < 10)

  // Estimate cost: Sonnet 4.6 pricing ($3/$15 per MTok) as default
  const estimatedCost = (totalInputTokens * 3 + totalOutputTokens * 15
    + totalCacheCreationTokens * 3.75 + totalCacheReadTokens * 0.3) / 1_000_000

  return {
    provider: 'Anthropic',
    success: true,
    data: {
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_cache_creation_tokens: totalCacheCreationTokens,
      total_cache_read_tokens: totalCacheReadTokens,
      estimated_cost_usd: Math.round(estimatedCost * 100) / 100,
      period_start: startOfMonth.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
    },
  }
}

// ── Main handler ────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return createJsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  // Support both user auth and cron secret
  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  let userId = 'system'

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    // Cron job — no user auth needed
    userId = 'cron'
  } else if (authHeader) {
    const admin = getSupabaseAdmin()
    const { data: { user }, error: authError } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authError || !user) {
      return createJsonResponse(req, { error: 'Unauthorized' }, 401)
    }
    userId = user.id
  } else {
    return createJsonResponse(req, { error: 'Missing authorization' }, 401)
  }

  try {
    // Optionally filter to specific providers
    let providers: string[] = ['serpapi', 'firecrawl', 'anthropic']
    try {
      const body = await req.json()
      if (Array.isArray(body.providers)) {
        providers = body.providers.map((p: string) => p.toLowerCase())
      }
    } catch {
      // No body or invalid JSON — sync all providers
    }

    const admin = getSupabaseAdmin()
    const results: ProviderResult[] = []

    // Fetch usage from all requested providers in parallel
    const fetchers: Promise<ProviderResult>[] = []
    if (providers.includes('serpapi')) fetchers.push(fetchSerpApiUsage())
    if (providers.includes('firecrawl')) fetchers.push(fetchFirecrawlUsage())
    if (providers.includes('anthropic')) fetchers.push(fetchAnthropicUsage())

    const fetched = await Promise.allSettled(fetchers)
    for (const result of fetched) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({ provider: 'unknown', success: false, error: result.reason?.message })
      }
    }

    // Write successful results to usage_records and update subscriptions
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    for (const result of results) {
      if (!result.success) continue

      // Look up api_entry_id by provider name
      const apiName = result.provider === 'Anthropic' ? 'Anthropic Claude' : result.provider
      const { data: apiEntry } = await admin
        .from('api_entries')
        .select('id')
        .eq('name', apiName)
        .single()

      if (!apiEntry) continue

      let callCount = 0
      let creditsUsed: number | null = null
      let cost = 0

      if (result.provider === 'SerpAPI') {
        callCount = result.data!.this_month_usage as number
        creditsUsed = callCount // credits_used = searches consumed
      } else if (result.provider === 'Firecrawl') {
        const planCredits = (result.data!.plan_credits as number) ?? 0
        const remaining = (result.data!.remaining_credits as number) ?? 0
        // If plan_credits is 0 (free/one-time), just track remaining
        callCount = planCredits > 0 ? planCredits - remaining : 0
        creditsUsed = planCredits > 0 ? planCredits - remaining : 0
      } else if (result.provider === 'Anthropic') {
        callCount = (result.data!.total_input_tokens as number) + (result.data!.total_output_tokens as number)
        creditsUsed = callCount // total tokens consumed
        cost = (result.data!.estimated_cost_usd as number) ?? 0
      }

      // Upsert usage record for current month
      // First check if one exists for this month
      const { data: existing } = await admin
        .from('usage_records')
        .select('id')
        .eq('api_entry_id', apiEntry.id)
        .eq('period_start', periodStart)
        .eq('source', 'api_import')
        .maybeSingle()

      if (existing) {
        await admin.from('usage_records').update({
          call_count: callCount,
          credits_used: creditsUsed,
          cost,
          metadata: result.data,
          recorded_at: now.toISOString(),
        }).eq('id', existing.id)
      } else {
        await admin.from('usage_records').insert({
          api_entry_id: apiEntry.id,
          period_start: periodStart,
          period_end: periodEnd,
          call_count: callCount,
          credits_used: creditsUsed,
          cost,
          source: 'api_import',
          metadata: result.data,
        })
      }

      // Update subscription current_usage if subscription exists
      if (result.provider === 'SerpAPI') {
        const usage = result.data!.this_month_usage as number
        await admin.from('subscriptions')
          .update({ current_usage: usage })
          .eq('api_entry_id', apiEntry.id)
      } else if (result.provider === 'Firecrawl') {
        const planCredits = (result.data!.plan_credits as number) ?? 0
        const remaining = (result.data!.remaining_credits as number) ?? 0
        const used = planCredits > 0 ? planCredits - remaining : 0
        await admin.from('subscriptions')
          .update({ current_usage: used })
          .eq('api_entry_id', apiEntry.id)
      }
    }

    await logAudit(admin, userId, 'usage.synced', 'usage_records', 'batch', {
      providers: results.map(r => r.provider),
      success_count: results.filter(r => r.success).length,
      error_count: results.filter(r => !r.success).length,
    }, req)

    return createJsonResponse(req, {
      synced_at: now.toISOString(),
      results,
    }, 200)
  } catch (err) {
    return createJsonResponse(req, { error: (err as Error).message }, 500)
  }
})
