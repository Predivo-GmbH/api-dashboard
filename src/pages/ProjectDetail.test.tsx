import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import { Route, Routes } from 'react-router-dom'
import ProjectDetail from './ProjectDetail'

vi.mock('@/hooks/useProjects', () => ({
  useProjectDetail: () => ({
    data: {
      id: 'p1',
      name: 'Arivioo',
      description: 'Travel platform',
      status: 'active',
      color: '#0D9488',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
      assignments: [],
      totalCost: 150.0,
    },
    isLoading: false,
  }),
  useAssignApi: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUnassignApi: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useApis', () => ({
  useApiList: () => ({
    data: [],
    isLoading: false,
  }),
}))

function renderProjectDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id" element={<ProjectDetail />} />
    </Routes>,
    { routerProps: { initialEntries: ['/projects/p1'] } },
  )
}

describe('ProjectDetail', () => {
  it('renders project name', () => {
    renderProjectDetail()
    expect(screen.getByRole('heading', { level: 1, name: 'Arivioo' })).toBeInTheDocument()
  })

  it('renders status badge', () => {
    renderProjectDetail()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders assigned APIs count', () => {
    renderProjectDetail()
    // "Assigned APIs" appears in both the stats card and the section header
    expect(screen.getAllByText('Assigned APIs').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders total cost', () => {
    renderProjectDetail()
    expect(screen.getByText('Total Cost (usage)')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('renders back link', () => {
    renderProjectDetail()
    expect(screen.getByRole('link', { name: /back to projects/i })).toBeInTheDocument()
  })
})
