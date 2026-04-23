import { render, screen } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'
import { ThemeProvider } from 'next-themes'

function renderWithTheme() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  it('renders toggle button with accessible label', () => {
    renderWithTheme()
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('has screen reader text', () => {
    renderWithTheme()
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })
})
