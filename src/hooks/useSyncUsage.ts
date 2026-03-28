import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ProviderResult {
  provider: string
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

interface SyncResponse {
  synced_at: string
  results: ProviderResult[]
}

export function useSyncUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('sync-usage', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error
      if (!data || typeof data !== 'object' || !('synced_at' in data) || !('results' in data)) {
        throw new Error('Unexpected sync-usage response shape')
      }
      return data as SyncResponse
    },
    onSuccess: (data) => {
      const succeeded = data.results.filter(r => r.success).length
      const failed = data.results.filter(r => !r.success).length

      queryClient.invalidateQueries({ queryKey: ['apis'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['usage-current-month'] })
      queryClient.invalidateQueries({ queryKey: ['last-sync-time'] })

      if (failed === 0) {
        toast.success(`Usage synced — ${succeeded} provider${succeeded !== 1 ? 's' : ''} updated`)
      } else {
        toast.warning(`Synced ${succeeded} provider${succeeded !== 1 ? 's' : ''}, ${failed} failed`, {
          description: data.results
            .filter(r => !r.success)
            .map(r => `${r.provider}: ${r.error}`)
            .join('; '),
        })
      }
    },
    onError: (err: Error) => {
      toast.error(`Sync failed: ${err.message}`)
    },
  })
}
