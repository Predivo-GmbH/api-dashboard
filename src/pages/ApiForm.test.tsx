import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import { Route, Routes } from 'react-router-dom'
import ApiForm from './ApiForm'

vi.mock('@/hooks/useApis', () => ({
  useApiDetail: () => ({
    data: undefined,
    isLoading: false,
  }),
  useCreateApi: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateApi: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

function renderApiForm(path = '/apis/new') {
  return renderWithProviders(
    <Routes>
      <Route path="/apis/new" element={<ApiForm />} />
      <Route path="/apis/:id/edit" element={<ApiForm />} />
    </Routes>,
    { routerProps: { initialEntries: [path] } },
  )
}

describe('ApiForm (create mode)', () => {
  it('renders "Add New API" heading', () => {
    renderApiForm()
    expect(screen.getByRole('heading', { level: 1, name: 'Add New API' })).toBeInTheDocument()
  })

  it('renders Name field', () => {
    renderApiForm()
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
  })

  it('renders Provider field', () => {
    renderApiForm()
    expect(screen.getByLabelText('Provider *')).toBeInTheDocument()
  })

  it('renders Description field', () => {
    renderApiForm()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('renders Create API submit button', () => {
    renderApiForm()
    expect(screen.getByRole('button', { name: 'Create API' })).toBeInTheDocument()
  })

  it('renders Cancel link', () => {
    renderApiForm()
    expect(screen.getByRole('link', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders Basic Information section', () => {
    renderApiForm()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
  })

  it('renders Endpoints section', () => {
    renderApiForm()
    expect(screen.getByText('Endpoints')).toBeInTheDocument()
  })

  it('renders Account & Billing section', () => {
    renderApiForm()
    expect(screen.getByText('Account & Billing')).toBeInTheDocument()
  })
})
