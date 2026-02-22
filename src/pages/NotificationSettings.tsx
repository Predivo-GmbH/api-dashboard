import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Email notification preferences and default recipients will be configurable here.
        </p>
      </CardContent>
    </Card>
  )
}
