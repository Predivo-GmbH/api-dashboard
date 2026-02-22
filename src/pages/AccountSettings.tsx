import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AccountSettings() {
  const { user } = useAuth()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{user?.email ?? 'Not signed in'}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Password change and account settings will be available here.
        </p>
      </CardContent>
    </Card>
  )
}
