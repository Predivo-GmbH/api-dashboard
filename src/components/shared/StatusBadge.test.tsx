import { render, screen } from '@testing-library/react'
import { ApiStatusBadge, HealthStatusBadge } from './StatusBadge'

describe('ApiStatusBadge', () => {
  it('renders the label for active status', () => {
    render(<ApiStatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders the label for deprecated status', () => {
    render(<ApiStatusBadge status="deprecated" />)
    expect(screen.getByText('Deprecated')).toBeInTheDocument()
  })

  it('renders the label for error status', () => {
    render(<ApiStatusBadge status="error" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders the label for rate_limited status', () => {
    render(<ApiStatusBadge status="rate_limited" />)
    expect(screen.getByText('Rate Limited')).toBeInTheDocument()
  })

  it('renders the label for inactive status', () => {
    render(<ApiStatusBadge status="inactive" />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })
})

describe('HealthStatusBadge', () => {
  it('renders "No data" for null status', () => {
    render(<HealthStatusBadge status={null} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders "Up" for up status', () => {
    render(<HealthStatusBadge status="up" />)
    expect(screen.getByText('Up')).toBeInTheDocument()
  })

  it('renders "Down" for down status', () => {
    render(<HealthStatusBadge status="down" />)
    expect(screen.getByText('Down')).toBeInTheDocument()
  })

  it('renders "Degraded" for degraded status', () => {
    render(<HealthStatusBadge status="degraded" />)
    expect(screen.getByText('Degraded')).toBeInTheDocument()
  })

  it('renders "Timeout" for timeout status', () => {
    render(<HealthStatusBadge status="timeout" />)
    expect(screen.getByText('Timeout')).toBeInTheDocument()
  })

  it('renders "Unknown" for unknown status', () => {
    render(<HealthStatusBadge status="unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
