import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import AuditLog from './AuditLog'

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: () => ({
    data: {
      data: [
        {
          id: 'a1',
          user_id: 'u1',
          action: 'credential.created',
          target_entity: 'SerpAPI',
          target_id: 'api1',
          metadata: { label: 'default' },
          ip_address: '127.0.0.1',
          user_agent: null,
          created_at: '2026-04-20T10:00:00Z',
        },
      ],
      count: 1,
    },
    isLoading: false,
  }),
}))

describe('AuditLog', () => {
  it('renders heading', () => {
    renderWithProviders(<AuditLog />)
    expect(screen.getByRole('heading', { level: 1, name: 'Audit Log' })).toBeInTheDocument()
  })

  it('renders entry count badge', () => {
    renderWithProviders(<AuditLog />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders action badge', () => {
    renderWithProviders(<AuditLog />)
    expect(screen.getAllByText('Key Created').length).toBeGreaterThanOrEqual(1)
  })

  it('renders target entity', () => {
    renderWithProviders(<AuditLog />)
    expect(screen.getAllByText('SerpAPI').length).toBeGreaterThanOrEqual(1)
  })
})
