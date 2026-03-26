import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface CreditBalance {
  id: string
  name: string
  provider: string
  credits_remaining: number
  current_usage: number
  quota_limit: number | null
  quota_unit: string | null
  billing_model: string | null
  cost_per_period: number | null
  renewal_date: string | null
}

interface DashboardStats {
  balances: CreditBalance[]
  apisRunningLow: number
  mostUrgent: CreditBalance | null
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

      // Only APIs with live credits_remaining data
      const balances: CreditBalance[] = entries
        .filter(a => a.credits_remaining !== null && a.credits_remaining !== undefined)
        .map(a => ({
          id: a.id,
          name: a.name,
          provider: a.provider,
          credits_remaining: Number(a.credits_remaining),
          current_usage: Number(a.current_usage ?? 0),
          quota_limit: a.quota_limit ? Number(a.quota_limit) : null,
          quota_unit: a.quota_unit,
          billing_model: a.billing_model,
          cost_per_period: a.cost_per_period ? Number(a.cost_per_period) : null,
          renewal_date: a.renewal_date,
        }))

      // APIs running low: remaining < 20% of quota (or < $2 for dollar-based)
      const apisRunningLow = balances.filter(b => {
        if (b.quota_limit && b.quota_limit > 0) {
          return (b.credits_remaining / b.quota_limit) < 0.2
        }
        // Dollar-based (Anthropic): low if < $2
        if (b.name === 'Anthropic Claude') {
          return b.credits_remaining < 2
        }
        return false
      }).length

      // Most urgent: lowest remaining percentage (or lowest dollar amount for prepaid)
      const sorted = [...balances].sort((a, b) => {
        const aPct = a.quota_limit && a.quota_limit > 0
          ? a.credits_remaining / a.quota_limit
          : a.credits_remaining / 100 // normalize dollar amounts
        const bPct = b.quota_limit && b.quota_limit > 0
          ? b.credits_remaining / b.quota_limit
          : b.credits_remaining / 100
        return aPct - bPct
      })
      const mostUrgent = sorted.length > 0 ? sorted[0] : null

      // Count active alerts
      const { count: activeAlerts, error: alertErr } = await supabase
        .from('triggered_alerts')
        .select('*', { count: 'exact', head: true })
        .is('acknowledged_at', null)

      if (alertErr) throw alertErr

      return {
        balances,
        apisRunningLow,
        mostUrgent,
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
