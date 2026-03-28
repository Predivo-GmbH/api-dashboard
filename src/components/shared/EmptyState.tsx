import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  headingLevel?: 'h2' | 'h3' | 'h4'
}

export function EmptyState({ icon: Icon, title, description, action, headingLevel: Tag = 'h2' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
      <div className="mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <Tag className="mb-1 text-lg font-semibold">{title}</Tag>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}
