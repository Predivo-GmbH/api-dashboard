import { useState, type ReactNode, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

const GATE_PASSWORD = 'predivoapidash2026'
const STORAGE_KEY = 'api-dashboard-unlocked'

function isUnlocked(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password === GATE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle>API Dashboard</CardTitle>
          <CardDescription>Enter password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">Incorrect password</p>
            )}
            <Button type="submit" className="w-full">
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
