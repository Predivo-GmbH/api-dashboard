import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import { Route, Routes } from 'react-router-dom'
import Settings from './Settings'

describe('Settings', () => {
  function renderSettings() {
    return renderWithProviders(
      <Routes>
        <Route path="/settings" element={<Settings />}>
          <Route index element={<div>Account Content</div>} />
          <Route path="notifications" element={<div>Notifications Content</div>} />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/settings'] } },
    )
  }

  it('renders heading', () => {
    renderSettings()
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders Account navigation link', () => {
    renderSettings()
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument()
  })

  it('renders Notifications navigation link', () => {
    renderSettings()
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('has settings navigation landmark', () => {
    renderSettings()
    expect(screen.getByRole('navigation', { name: 'Settings sections' })).toBeInTheDocument()
  })
})
