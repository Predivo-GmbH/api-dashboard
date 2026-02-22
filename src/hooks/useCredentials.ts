import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export function useEncryptCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      api_entry_id,
      label,
      plaintext_key,
    }: {
      api_entry_id: string
      label: string
      plaintext_key: string
    }) => {
      const headers = await getAuthHeaders()
      const res = await fetch(`${FUNCTIONS_URL}/encrypt-secret`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ api_entry_id, label, plaintext_key }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to encrypt credential')
      }

      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      toast.success('Credential added successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to add credential: ${err.message}`)
    },
  })
}

export function useDecryptCredential() {
  return useMutation({
    mutationFn: async (credential_id: string) => {
      const headers = await getAuthHeaders()
      const res = await fetch(`${FUNCTIONS_URL}/decrypt-secret`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ credential_id }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to decrypt credential')
      }

      const data = await res.json()
      return data.plaintext_key as string
    },
    onError: (err: Error) => {
      toast.error(`Failed to reveal credential: ${err.message}`)
    },
  })
}

export function useDeactivateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, api_entry_id }: { id: string; api_entry_id: string }) => {
      const { error } = await supabase
        .from('api_credentials')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      return { id, api_entry_id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      toast.success('Credential deactivated')
    },
    onError: (err: Error) => {
      toast.error(`Failed to deactivate credential: ${err.message}`)
    },
  })
}

export function useDeleteCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, api_entry_id }: { id: string; api_entry_id: string }) => {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, api_entry_id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api', variables.api_entry_id] })
      toast.success('Credential deleted')
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete credential: ${err.message}`)
    },
  })
}
