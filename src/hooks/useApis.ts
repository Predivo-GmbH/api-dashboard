import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ApiEntry, ApiOverview } from '@/types/api'
import { toast } from 'sonner'

export function useApiList(filters?: {
  status?: string
  category?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['apis', filters],
    queryFn: async (): Promise<ApiOverview[]> => {
      let query = supabase
        .from('v_api_overview')
        .select('*')
        .order('name')

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useApiDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['api', id],
    queryFn: async (): Promise<ApiEntry> => {
      if (!id) throw new Error('API id is required')

      const { data, error } = await supabase
        .from('api_entries')
        .select(`
          *,
          api_project_assignments (
            id, project_id, env_var_name, notes, created_at,
            projects:project_id (id, name, color, status)
          ),
          api_credentials (
            id, label, key_hint, is_active, created_at, rotated_at, expires_at
          ),
          subscriptions (*),
          alert_settings (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ApiEntry
    },
    enabled: !!id,
  })
}

export function useCreateApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: Omit<ApiEntry, 'id' | 'created_at' | 'updated_at' | 'api_project_assignments' | 'api_credentials' | 'subscriptions' | 'alert_settings'>) => {
      const { data, error } = await supabase
        .from('api_entries')
        .insert(entry)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] })
      toast.success('API created successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to create API: ${err.message}`)
    },
  })
}

export function useUpdateApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApiEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('api_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apis'] })
      queryClient.invalidateQueries({ queryKey: ['api', data.id] })
      toast.success('API updated successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to update API: ${err.message}`)
    },
  })
}

export function useDeleteApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] })
      toast.success('API deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete API: ${err.message}`)
    },
  })
}
