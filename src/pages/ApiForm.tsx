import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ApiForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={isEditing ? `/apis/${id}` : '/apis'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold">
        {isEditing ? 'Edit API' : 'Add New API'}
      </h1>
      <p className="text-muted-foreground">
        API form with all fields (name, provider, category, credentials, subscription) will appear here.
      </p>
    </div>
  )
}
