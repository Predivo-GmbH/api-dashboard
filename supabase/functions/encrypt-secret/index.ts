import { handleCors, createJsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { encryptSecret } from '../_shared/encryption.ts'
import { logAudit } from '../_shared/auditLogger.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return createJsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return createJsonResponse(req, { error: 'Missing authorization' }, 401)
  }

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await admin.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  if (authError || !user) {
    return createJsonResponse(req, { error: 'Unauthorized' }, 401)
  }

  try {
    const { api_entry_id, label, plaintext_key } = await req.json()

    if (!api_entry_id || !plaintext_key) {
      return createJsonResponse(req, { error: 'api_entry_id and plaintext_key are required' }, 400)
    }

    const { encrypted, iv, authTag, hint } = await encryptSecret(plaintext_key)

    const { data, error } = await admin.from('api_credentials').insert({
      api_entry_id,
      label: label || 'default',
      encrypted_key: encrypted,
      iv,
      auth_tag: authTag,
      key_hint: hint,
    }).select('id, label, key_hint, is_active, created_at').single()

    if (error) {
      console.error('encrypt-secret DB error:', error.message)
      return createJsonResponse(req, { error: 'Failed to store credential' }, 500)
    }

    await logAudit(admin, user.id, 'credential.created', 'api_credential', data.id, {
      api_entry_id,
      label: label || 'default',
    }, req)

    return createJsonResponse(req, data, 201)
  } catch (err) {
    console.error('encrypt-secret error:', (err as Error).message)
    return createJsonResponse(req, { error: 'Internal server error' }, 500)
  }
})
