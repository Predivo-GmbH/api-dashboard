import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete Item',
    description: 'Are you sure?',
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and description when open', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog {...defaultProps} confirmLabel="Yes, delete" cancelLabel="No, keep" />
    )
    expect(screen.getByRole('button', { name: 'No, keep' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmDialog {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmDialog {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows loading state', () => {
    render(<ConfirmDialog {...defaultProps} loading />)
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
  })
})
