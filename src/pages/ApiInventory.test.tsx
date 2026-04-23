import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import ApiInventory from './ApiInventory'

vi.mock('@/hooks/useApis', () => ({
  useApiList: () => ({
    data: [
      {
        id: '1',
        name: 'SerpAPI',
        provider: 'SerpApi LLC',
        category: 'search',
        status: 'active',
        health_status: 'up',
        plan_name: 'Pro',
        quota_limit: 10000,
        quota_unit: 'searches',
        current_usage: 2000,
        cost_per_period: 49.99,
        renewal_date: '2026-05-15',
        quota_usage_pct: 20,
        billing_model: 'monthly_subscription',
        account_owner: null,
        health_response_ms: null,
        last_health_check: null,
        credits_remaining: null,
      },
    ],
    isLoading: false,
  }),
}))

describe('ApiInventory', () => {
  it('renders the heading', () => {
    renderWithProviders(<ApiInventory />)
    expect(screen.getByRole('heading', { level: 1, name: 'APIs' })).toBeInTheDocument()
  })

  it('renders Add API button', () => {
    renderWithProviders(<ApiInventory />)
    expect(screen.getByRole('link', { name: /add api/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<ApiInventory />)
    expect(screen.getByRole('textbox', { name: /search apis/i })).toBeInTheDocument()
  })

  it('renders API count badge', () => {
    renderWithProviders(<ApiInventory />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders the API name in the list', () => {
    renderWithProviders(<ApiInventory />)
    expect(screen.getAllByText('SerpAPI').length).toBeGreaterThanOrEqual(1)
  })
})
