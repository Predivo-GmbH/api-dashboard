import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold">Project Details</h1>
      <p className="text-sm text-muted-foreground">ID: {id}</p>
      <p className="mt-4 text-muted-foreground">
        Assigned APIs, cost breakdown, and project management will appear here.
      </p>
    </div>
  )
}
