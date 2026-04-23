import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/test-utils'
import Auth from './Auth'

describe('Auth', () => {
  it('renders sign-in form', () => {
    renderWithProviders(<Auth />)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders encryption notice', () => {
    renderWithProviders(<Auth />)
    expect(screen.getByText(/AES-256 encryption/)).toBeInTheDocument()
  })

  it('allows typing in email and password fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Auth />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'secret123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('secret123')
  })

  it('shows description text', () => {
    renderWithProviders(<Auth />)
    expect(screen.getByText('Sign in to manage your APIs')).toBeInTheDocument()
  })
})
