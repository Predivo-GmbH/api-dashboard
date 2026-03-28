import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

const isScreenshotMode = import.meta.env.VITE_SCREENSHOT_MODE === 'true'

const mockUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'screenshot@predivo.ch',
  app_metadata: {},
  user_metadata: { full_name: 'Screenshot User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const mockSession = {
  access_token: 'mock',
  refresh_token: 'mock',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
} as Session

export function useAuth() {
  const [session, setSession] = useState<Session | null>(isScreenshotMode ? mockSession : null)
  const [user, setUser] = useState<User | null>(isScreenshotMode ? mockUser : null)
  const [loading, setLoading] = useState(isScreenshotMode ? false : true)

  useEffect(() => {
    if (isScreenshotMode) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { session, user, loading, signOut }
}
