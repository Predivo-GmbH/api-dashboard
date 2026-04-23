import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import Dashboard from './Dashboard'

// Mock the hooks to avoid Supabase calls
vi.mock('@/hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({
    data: {
      balances: [
        {
          id: '1',
          name: 'Test API',
          provider: 'Test Provider',
          credits_remaining: 500,
          current_usage: 200,
          quota_limit: 1000,
          quota_unit: 'requests',
          billing_model: 'pay_as_you_go',
          cost_per_period: null,
          renewal_date: null,
        },
      ],
      apisRunningLow: 0,
      mostUrgent: null,
      activeAlerts: 0,
    },
    isLoading: false,
  }),
  useRecentAlerts: () => ({
    data: [],
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useSyncUsage', () => ({
  useSyncUsage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useUsageRecords', () => ({
  useLastSyncTime: () => ({
    data: null,
  }),
}))

describe('Dashboard', () => {
  it('renders the heading', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders the Sync Now button', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument()
  })

  it('renders Credits Status card', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('Credits Status')).toBeInTheDocument()
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders Credit Balances section', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('Credit Balances')).toBeInTheDocument()
  })

  it('renders Active Alerts section', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('Active Alerts')).toBeInTheDocument()
  })
})
