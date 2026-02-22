import { FolderKanban } from 'lucide-react'

export default function Projects() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <FolderKanban className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>
      <p className="text-muted-foreground">
        Project overview with assigned APIs and cost breakdown will appear here.
      </p>
    </div>
  )
}
