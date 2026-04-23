import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEncryptCredential, useDecryptCredential, useDeactivateCredential, useDeleteCredential } from './useCredentials'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children })
  }
}

describe('useEncryptCredential', () => {
  it('returns a mutation with mutate and mutateAsync', () => {
    const { result } = renderHook(() => useEncryptCredential(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('mutate')
    expect(result.current).toHaveProperty('mutateAsync')
    expect(result.current.isPending).toBe(false)
  })
})

describe('useDecryptCredential', () => {
  it('returns a mutation with mutate and mutateAsync', () => {
    const { result } = renderHook(() => useDecryptCredential(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('mutate')
    expect(result.current).toHaveProperty('mutateAsync')
  })
})

describe('useDeactivateCredential', () => {
  it('returns a mutation', () => {
    const { result } = renderHook(() => useDeactivateCredential(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })
})

describe('useDeleteCredential', () => {
  it('returns a mutation', () => {
    const { result } = renderHook(() => useDeleteCredential(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })
})
