import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ALERT_TYPES } from '@/lib/constants'

export default function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Configure default email recipients for alerts. You can also set per-API recipients on each API's alert settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-email">Default Recipient Email</Label>
            <Input
              id="default-email"
              type="email"
              placeholder="roger@predivo.ch"
              defaultValue="roger@predivo.ch"
            />
            <p className="text-xs text-muted-foreground">
              This email receives all alerts unless overridden per-API.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Alert Types</h3>
            {Object.entries(ALERT_TYPES).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Alert delivery requires the send-alerts edge function to be deployed (Phase 3).
      </p>
    </div>
  )
}
