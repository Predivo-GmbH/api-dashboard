import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Subscription } from '@/types/api'
import { toast } from 'sonner'

export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sub: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(sub)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      queryClient.invalidateQueries({ queryKey: ['apis'] })
      toast.success('Subscription added')
    },
    onError: (err: Error) => {
      toast.error(`Failed to add subscription: ${err.message}`)
    },
  })
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api', data.api_entry_id] })
      queryClient.invalidateQueries({ queryKey: ['apis'] })
      toast.success('Subscription updated')
    },
    onError: (err: Error) => {
      toast.error(`Failed to update subscription: ${err.message}`)
    },
  })
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, api_entry_id }: { id: string; api_entry_id: string }) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { api_entry_id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      queryClient.invalidateQueries({ queryKey: ['apis'] })
      toast.success('Subscription deleted')
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete subscription: ${err.message}`)
    },
  })
}
