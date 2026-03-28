import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { PasswordGate } from '@/components/shared/PasswordGate'
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteAnnouncer } from '@/components/shared/RouteAnnouncer'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

// Lazy-loaded pages
const Landing = lazy(() => import('@/pages/Landing'))
const Auth = lazy(() => import('@/pages/Auth'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ApiInventory = lazy(() => import('@/pages/ApiInventory'))
const ApiDetail = lazy(() => import('@/pages/ApiDetail'))
const ApiForm = lazy(() => import('@/pages/ApiForm'))
const Projects = lazy(() => import('@/pages/Projects'))
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'))
const AuditLog = lazy(() => import('@/pages/AuditLog'))
const Settings = lazy(() => import('@/pages/Settings'))
const AccountSettings = lazy(() => import('@/pages/AccountSettings'))
const NotificationSettings = lazy(() => import('@/pages/NotificationSettings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}

function GatedRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apis" element={<ApiInventory />} />
        <Route path="/apis/new" element={<ApiForm />} />
        <Route path="/apis/:id" element={<ApiDetail />} />
        <Route path="/apis/:id/edit" element={<ApiForm />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/settings" element={<Settings />}>
          <Route index element={<AccountSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <Loading />

  return (
    <PasswordGate>
      <RouteAnnouncer />
      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Landing />
          }
        />
        <Route
          path="/auth"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Auth />
          }
        />
        <Route path="/*" element={<GatedRoutes />} />
      </Routes>
    </PasswordGate>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
