import { Link } from 'react-router-dom'
import { Key, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ApiInventory() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6" />
          <h1 className="text-2xl font-bold">APIs</h1>
        </div>
        <Button asChild>
          <Link to="/apis/new">
            <Plus className="mr-2 h-4 w-4" />
            Add API
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground">
        API inventory with status, health, and subscription info will appear here.
      </p>
    </div>
  )
}
