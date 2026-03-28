import { Outlet, NavLink } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const SETTINGS_NAV = [
  { to: '/settings', label: 'Account', end: true },
  { to: '/settings/notifications', label: 'Notifications', end: false },
] as const

export default function Settings() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <SettingsIcon className="h-6 w-6" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <nav className="mb-6 flex gap-2 border-b" aria-label="Settings sections">
        {SETTINGS_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-4 pb-2 pt-2 min-h-[44px] inline-flex items-center text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
