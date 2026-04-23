import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateSubscription, useUpdateSubscription, useDeleteSubscription } from './useSubscriptions'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children })
  }
}

describe('useCreateSubscription', () => {
  it('returns a mutation with mutate', () => {
    const { result } = renderHook(() => useCreateSubscription(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('mutate')
    expect(result.current.isPending).toBe(false)
  })
})

describe('useUpdateSubscription', () => {
  it('returns a mutation with mutate', () => {
    const { result } = renderHook(() => useUpdateSubscription(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('mutate')
    expect(result.current.isPending).toBe(false)
  })
})

describe('useDeleteSubscription', () => {
  it('returns a mutation with mutate', () => {
    const { result } = renderHook(() => useDeleteSubscription(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('mutate')
    expect(result.current.isPending).toBe(false)
  })
})
