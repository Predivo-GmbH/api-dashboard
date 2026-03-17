import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordGate } from './PasswordGate'

describe('PasswordGate', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shows password form when locked', () => {
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    expect(screen.getByText('Predivo APIs')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows children when correct password entered', async () => {
    const user = userEvent.setup()

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByPlaceholderText('Password')
    await user.type(input, 'predivoapidash2026')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows error on wrong password', async () => {
    const user = userEvent.setup()

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByPlaceholderText('Password')
    await user.type(input, 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    expect(screen.getByText('Incorrect password')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('stays unlocked after sessionStorage is set', () => {
    sessionStorage.setItem('api-dashboard-unlocked', 'true')

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
