import { ScrollText } from 'lucide-react'

export default function AuditLog() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Audit Log</h1>
      </div>
      <p className="text-muted-foreground">
        Paginated audit trail of all credential accesses and changes will appear here.
      </p>
    </div>
  )
}
