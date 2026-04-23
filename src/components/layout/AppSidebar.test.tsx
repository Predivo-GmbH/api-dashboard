import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import { AppSidebar } from './AppSidebar'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@predivo.ch' },
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}))

describe('AppSidebar', () => {
  it('renders all navigation links', () => {
    renderWithProviders(<AppSidebar />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apis/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /audit log/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    renderWithProviders(<AppSidebar />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('renders app name', () => {
    renderWithProviders(<AppSidebar />)
    expect(screen.getByText('Predivo APIs')).toBeInTheDocument()
  })

  it('renders theme toggle', () => {
    renderWithProviders(<AppSidebar />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('has correct navigation link hrefs', () => {
    renderWithProviders(<AppSidebar />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /apis/i })).toHaveAttribute('href', '/apis')
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects')
  })
})
