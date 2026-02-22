import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Key,
  FolderKanban,
  ScrollText,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/apis', label: 'APIs', icon: Key },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

interface AppSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const { signOut } = useAuth()

  return (
    <aside
      className={cn(
        'flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground',
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4 font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-500 text-white text-sm font-bold">
          A
        </div>
        <span>API Dashboard</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="flex items-center justify-between p-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
