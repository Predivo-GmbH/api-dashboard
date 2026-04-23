import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import Landing from './Landing'

describe('Landing', () => {
  it('renders the hero heading', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('API Management')
  })

  it('renders "Sign in" link', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth')
  })

  it('renders "Get started" link', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/auth')
  })

  it('renders all 6 feature cards', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByText('Credential Management')).toBeInTheDocument()
    expect(screen.getByText('Health Monitoring')).toBeInTheDocument()
    expect(screen.getByText('Cost Tracking')).toBeInTheDocument()
    expect(screen.getByText('Project Organization')).toBeInTheDocument()
    expect(screen.getByText('Audit Trail')).toBeInTheDocument()
    expect(screen.getByText('Security First')).toBeInTheDocument()
  })

  it('renders footer with company name', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByText(/Predivo GmbH/)).toBeInTheDocument()
  })

  it('renders "Everything you need" section heading', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByRole('heading', { name: 'Everything you need' })).toBeInTheDocument()
  })
})
