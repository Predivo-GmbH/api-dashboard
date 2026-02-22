import { handleCors, createJsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { decryptSecret } from '../_shared/encryption.ts'
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
    const { credential_id } = await req.json()

    if (!credential_id) {
      return createJsonResponse(req, { error: 'credential_id is required' }, 400)
    }

    const { data: cred, error } = await admin
      .from('api_credentials')
      .select('id, api_entry_id, encrypted_key, iv, auth_tag')
      .eq('id', credential_id)
      .single()

    if (error || !cred) {
      return createJsonResponse(req, { error: 'Credential not found' }, 404)
    }

    const plaintext = await decryptSecret(cred.encrypted_key, cred.iv, cred.auth_tag)

    await logAudit(admin, user.id, 'credential.viewed', 'api_credential', cred.id, {
      api_entry_id: cred.api_entry_id,
    }, req)

    return createJsonResponse(req, { plaintext_key: plaintext })
  } catch (err) {
    return createJsonResponse(req, { error: (err as Error).message }, 500)
  }
})
