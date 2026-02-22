import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AuditLogEntry } from '@/types/api'

interface AuditLogFilters {
  action?: string
  page?: number
  pageSize?: number
}

export function useAuditLog(filters: AuditLogFilters = {}) {
  const { action, page = 1, pageSize = 25 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return useQuery({
    queryKey: ['audit-log', { action, page, pageSize }],
    queryFn: async (): Promise<{ data: AuditLogEntry[]; count: number }> => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (action) {
        query = query.eq('action', action)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: data ?? [], count: count ?? 0 }
    },
  })
}
