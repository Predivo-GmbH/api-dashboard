import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface UsageWithApi {
  id: string
  api_entry_id: string
  period_start: string
  period_end: string
  call_count: number
  credits_used: number | null
  cost: number
  source: string
  metadata: Record<string, unknown> | null
  recorded_at: string
  api_entries: {
    id: string
    name: string
    provider: string
    category: string
  }
  subscription: {
    quota_limit: number | null
    quota_unit: string
    current_usage: number
    credits_remaining: number | null
    plan_name: string
  } | null
}

export function useCurrentMonthUsage() {
  return useQuery({
    queryKey: ['usage-current-month'],
    queryFn: async (): Promise<UsageWithApi[]> => {
      const now = new Date()
      const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      // Fetch usage records with API info
      const { data: records, error: recErr } = await supabase
        .from('usage_records')
        .select(`
          *,
          api_entries!inner (id, name, provider, category)
        `)
        .eq('source', 'api_import')
        .eq('period_start', periodStart)
        .order('cost', { ascending: false })

      if (recErr) throw recErr
      if (!records || records.length === 0) return []

      // Fetch subscriptions for these APIs
      const apiIds = records.map((r: { api_entry_id: string }) => r.api_entry_id)
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('api_entry_id, quota_limit, quota_unit, current_usage, credits_remaining, plan_name')
        .in('api_entry_id', apiIds)

      const subMap = new Map(
        (subs ?? []).map((s: { api_entry_id: string }) => [s.api_entry_id, s])
      )

      return records.map((row: Record<string, unknown>) => ({
        ...row,
        subscription: subMap.get(row.api_entry_id as string) ?? null,
      })) as UsageWithApi[]
    },
  })
}

export function useLastSyncTime() {
  return useQuery({
    queryKey: ['last-sync-time'],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('usage_records')
        .select('recorded_at')
        .eq('source', 'api_import')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data?.recorded_at ?? null
    },
  })
}
