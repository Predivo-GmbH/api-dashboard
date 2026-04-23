import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { Key } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState icon={Key} title="No items" description="Nothing to show here." />
    )
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Nothing to show here.')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={Key}
        title="Empty"
        description="Add something."
        action={<button>Add</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('does not render action when not provided', () => {
    render(
      <EmptyState icon={Key} title="Empty" description="Nothing." />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('uses h2 heading by default', () => {
    render(
      <EmptyState icon={Key} title="Test Title" description="Desc" />
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Test Title' })).toBeInTheDocument()
  })

  it('uses custom heading level when specified', () => {
    render(
      <EmptyState icon={Key} title="Test Title" description="Desc" headingLevel="h3" />
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Test Title' })).toBeInTheDocument()
  })
})
