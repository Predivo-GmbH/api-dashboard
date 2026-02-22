import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function logAudit(
  admin: SupabaseClient,
  userId: string,
  action: string,
  targetEntity: string,
  targetId: string,
  metadata?: Record<string, unknown>,
  request?: Request,
): Promise<void> {
  const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request?.headers.get('cf-connecting-ip') || null
  const userAgent = request?.headers.get('user-agent') || null

  await admin.from('audit_logs').insert({
    user_id: userId,
    action,
    target_entity: targetEntity,
    target_id: targetId,
    metadata: metadata ?? null,
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}
