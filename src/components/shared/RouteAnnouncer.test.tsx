import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RouteAnnouncer } from './RouteAnnouncer'

describe('RouteAnnouncer', () => {
  it('renders an aria-live region', () => {
    render(
      <MemoryRouter>
        <RouteAnnouncer />
      </MemoryRouter>
    )
    const announcer = screen.getByRole('status')
    expect(announcer).toHaveAttribute('aria-live', 'assertive')
    expect(announcer).toHaveAttribute('aria-atomic', 'true')
  })

  it('has sr-only class for visual hiding', () => {
    render(
      <MemoryRouter>
        <RouteAnnouncer />
      </MemoryRouter>
    )
    const announcer = screen.getByRole('status')
    expect(announcer).toHaveClass('sr-only')
  })
})
