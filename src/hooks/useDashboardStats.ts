import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface LowestRemaining {
  name: string
  remaining: number
  unit: string
  pct: number
}

interface DashboardStats {
  apisRunningLow: number
  lowestRemaining: LowestRemaining | null
  payAsYouGoCount: number
  payAsYouGoSpend: number
  activeAlerts: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: apis, error: apiErr } = await supabase
        .from('v_api_overview')
        .select('*')

      if (apiErr) throw apiErr

      const entries = apis ?? []

      // APIs running low (>=70% quota usage)
      const apisRunningLow = entries.filter(
        a => a.quota_usage_pct !== null && a.quota_usage_pct >= 70
      ).length

      // Find the API closest to exhaustion
      const withQuota = entries
        .filter(a => a.quota_limit && a.quota_limit > 0 && a.current_usage !== null)
        .map(a => ({
          name: a.name,
          remaining: a.quota_limit! - (a.current_usage ?? 0),
          unit: a.quota_unit ?? 'credits',
          pct: a.quota_usage_pct ?? 0,
        }))
        .sort((a, b) => b.pct - a.pct)

      const lowestRemaining = withQuota.length > 0 ? withQuota[0] : null

      // Pay-as-you-go APIs (no hard quota)
      const payAsYouGoApis = entries.filter(
        a => a.billing_model === 'pay_as_you_go' && (a.quota_limit === null || a.quota_limit === 0)
      )
      const payAsYouGoCount = payAsYouGoApis.length

      // Get actual spend from usage_records for pay-as-you-go APIs this month
      const now = new Date()
      const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const { data: usageRecords } = await supabase
        .from('usage_records')
        .select('cost')
        .eq('source', 'api_import')
        .eq('period_start', periodStart)

      const payAsYouGoSpend = (usageRecords ?? []).reduce(
        (sum, r) => sum + Number(r.cost), 0
      )

      // Count active alerts
      const { count: activeAlerts, error: alertErr } = await supabase
        .from('triggered_alerts')
        .select('*', { count: 'exact', head: true })
        .is('acknowledged_at', null)

      if (alertErr) throw alertErr

      return {
        apisRunningLow,
        lowestRemaining,
        payAsYouGoCount,
        payAsYouGoSpend,
        activeAlerts: activeAlerts ?? 0,
      }
    },
  })
}

export function useRecentAlerts() {
  return useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('triggered_alerts')
        .select(`
          *,
          api_entries:api_entry_id (name, provider)
        `)
        .is('acknowledged_at', null)
        .order('sent_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
  })
}

export function useMonthlyCosts() {
  return useQuery({
    queryKey: ['monthly-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_monthly_cost_by_project')
        .select('*')
        .order('month', { ascending: false })
        .limit(60)

      if (error) throw error
      return data ?? []
    },
  })
}
