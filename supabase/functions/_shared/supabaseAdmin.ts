import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = Deno.env.get('SUPABASE_URL')
    if (!url) throw new Error('Missing env var SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!key) throw new Error('Missing env var SUPABASE_SERVICE_ROLE_KEY')
    adminClient = createClient(url, key)
  }
  return adminClient
}
