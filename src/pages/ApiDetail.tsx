import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ApiDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/apis">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to APIs
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">API Details</h1>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <p className="text-muted-foreground">API overview, subscription, and project assignments.</p>
        </TabsContent>
        <TabsContent value="credentials" className="mt-4">
          <p className="text-muted-foreground">Encrypted credential management.</p>
        </TabsContent>
        <TabsContent value="usage" className="mt-4">
          <p className="text-muted-foreground">Usage tracking and charts.</p>
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <p className="text-muted-foreground">Health check history.</p>
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <p className="text-muted-foreground">Alert configuration.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
