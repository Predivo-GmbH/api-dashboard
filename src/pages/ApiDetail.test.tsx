import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import { Route, Routes } from 'react-router-dom'
import ApiDetail from './ApiDetail'

vi.mock('@/hooks/useApis', () => ({
  useApiDetail: () => ({
    data: {
      id: '1',
      name: 'TestAPI',
      provider: 'Test Corp',
      description: 'A test API',
      docs_url: 'https://docs.example.com',
      base_url: 'https://api.example.com/v1',
      health_check_url: null,
      health_check_method: 'GET',
      api_type: 'rest',
      category: 'search',
      account_owner: 'roger',
      account_email: 'roger@test.com',
      billing_model: 'pay_as_you_go',
      status: 'active',
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
      api_credentials: [],
      subscriptions: [],
      api_project_assignments: [],
      alert_settings: [],
    },
    isLoading: false,
  }),
  useDeleteApi: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useCredentials', () => ({
  useEncryptCredential: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDecryptCredential: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeactivateCredential: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCredential: () => ({ mutate: vi.fn(), isPending: false }),
}))

function renderApiDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/apis/:id" element={<ApiDetail />} />
    </Routes>,
    { routerProps: { initialEntries: ['/apis/1'] } },
  )
}

describe('ApiDetail', () => {
  it('renders API name', () => {
    renderApiDetail()
    expect(screen.getByRole('heading', { level: 1, name: 'TestAPI' })).toBeInTheDocument()
  })

  it('renders provider info', () => {
    renderApiDetail()
    expect(screen.getByText(/Test Corp/)).toBeInTheDocument()
  })

  it('renders status badge', () => {
    renderApiDetail()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders Edit button', () => {
    renderApiDetail()
    expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument()
  })

  it('renders Delete button', () => {
    renderApiDetail()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('renders tab buttons', () => {
    renderApiDetail()
    expect(screen.getByRole('tab', { name: /credentials/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /subscription/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /projects/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /health/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /alerts/i })).toBeInTheDocument()
  })

  it('renders back link', () => {
    renderApiDetail()
    expect(screen.getByRole('link', { name: /back to apis/i })).toBeInTheDocument()
  })
})
