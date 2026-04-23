import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('renders the heading', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('renders description text', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByText("The page you're looking for doesn't exist.")).toBeInTheDocument()
  })

  it('renders link to dashboard', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute('href', '/dashboard')
  })
})
