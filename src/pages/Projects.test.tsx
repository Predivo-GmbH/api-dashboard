import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import Projects from './Projects'

vi.mock('@/hooks/useProjects', () => ({
  useProjectList: () => ({
    data: [
      {
        id: 'p1',
        name: 'Arivioo',
        description: 'Travel platform',
        status: 'active',
        color: '#0D9488',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useCreateProject: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe('Projects', () => {
  it('renders heading', () => {
    renderWithProviders(<Projects />)
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
  })

  it('renders Add Project button', () => {
    renderWithProviders(<Projects />)
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument()
  })

  it('renders project card', () => {
    renderWithProviders(<Projects />)
    expect(screen.getByText('Arivioo')).toBeInTheDocument()
    expect(screen.getByText('Travel platform')).toBeInTheDocument()
  })

  it('renders project count badge', () => {
    renderWithProviders(<Projects />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders project status badge', () => {
    renderWithProviders(<Projects />)
    expect(screen.getByText('active')).toBeInTheDocument()
  })
})
