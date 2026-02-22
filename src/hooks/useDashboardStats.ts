import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalApis: number
  activeApis: number
  healthyApis: number
  unhealthyApis: number
  totalMonthlyCost: number
  activeAlerts: number
  upcomingRenewals: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch API overview for aggregation
      const { data: apis, error: apiErr } = await supabase
        .from('v_api_overview')
        .select('*')

      if (apiErr) throw apiErr

      const entries = apis ?? []
      const totalApis = entries.length
      const activeApis = entries.filter(a => a.status === 'active').length
      const healthyApis = entries.filter(a => a.health_status === 'up').length
      const unhealthyApis = entries.filter(a => a.health_status === 'down' || a.health_status === 'degraded').length

      // Sum monthly costs from subscriptions
      const totalMonthlyCost = entries.reduce((sum, a) => {
        if (!a.cost_per_period) return sum
        return sum + Number(a.cost_per_period)
      }, 0)

      // Count active alerts (triggered but not acknowledged)
      const { count: activeAlerts, error: alertErr } = await supabase
        .from('triggered_alerts')
        .select('*', { count: 'exact', head: true })
        .is('acknowledged_at', null)

      if (alertErr) throw alertErr

      // Count upcoming renewals (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const upcomingRenewals = entries.filter(a => {
        if (!a.renewal_date) return false
        return new Date(a.renewal_date) <= thirtyDaysFromNow
      }).length

      return {
        totalApis,
        activeApis,
        healthyApis,
        unhealthyApis,
        totalMonthlyCost,
        activeAlerts: activeAlerts ?? 0,
        upcomingRenewals,
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
