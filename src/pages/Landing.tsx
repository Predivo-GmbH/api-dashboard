import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Shield, Key, Activity, Clock, FolderKanban, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Key,
    title: 'Credential Management',
    description: 'Store, rotate, and reveal API keys with AES-256-GCM encryption.',
  },
  {
    icon: Activity,
    title: 'Health Monitoring',
    description: 'Track uptime, latency, and health status across all your APIs.',
  },
  {
    icon: BarChart3,
    title: 'Cost Tracking',
    description: 'Monitor monthly spend per API and project with trend analysis.',
  },
  {
    icon: FolderKanban,
    title: 'Project Organization',
    description: 'Group APIs by project with environment variable mapping.',
  },
  {
    icon: Clock,
    title: 'Audit Trail',
    description: 'Full audit log of every credential access, rotation, and change.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'End-to-end encryption, role-based access, and session management.',
  },
]

export default function Landing() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="font-mono text-sm font-bold text-primary-foreground">[·]</span>
            </div>
            <span className="text-lg font-semibold">Predivo APIs</span>
          </div>
          <Link to="/auth">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          API Management
          <br />
          <span className="text-primary">for Predivo projects</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          One dashboard to manage every API key, credential, subscription, and integration across all your products.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth">
            <Button size="lg">Get started</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold">Everything you need</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-card p-5"
              >
                <feature.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Predivo API Dashboard</span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Internal tool — AES-256 encrypted
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
