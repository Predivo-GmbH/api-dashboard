import { LayoutDashboard } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <p className="text-muted-foreground">
        Overview of all API statuses, costs, and alerts will appear here.
      </p>
    </div>
  )
}
