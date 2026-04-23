import { renderHook, act } from '@testing-library/react'
import { supabase } from '@/lib/supabase'

// Ensure screenshot mode is off by mocking the module
vi.mock('@/hooks/useAuth', async (importOriginal) => {
  // We cannot easily control import.meta.env in the module scope,
  // so we test the exported hook's interface instead
  return await importOriginal()
})

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure VITE_SCREENSHOT_MODE is not set
    // @ts-expect-error -- Vite env stub
    import.meta.env.VITE_SCREENSHOT_MODE = undefined
  })

  it('exports user, loading, session, and signOut', async () => {
    // Dynamically import to pick up the env var
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('session')
    expect(result.current).toHaveProperty('signOut')
  })

  it('signOut is a function', async () => {
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    expect(typeof result.current.signOut).toBe('function')
  })

  it('signOut calls supabase auth signOut', async () => {
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.signOut()
    })
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
