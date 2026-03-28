import { useState, type ReactNode, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

const PASSWORD_HASH = '3bd8037a8ed38a35825983767f94e6cf3b18c3deee1601daee71faec0d83565f'
const STORAGE_KEY = 'api-dashboard-unlocked'

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function isUnlocked(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const inputHash = await sha256(password)
    if (inputHash === PASSWORD_HASH) {
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
            <Lock className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <CardTitle>Predivo APIs</CardTitle>
          <CardDescription>Enter password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              autoFocus
              className="text-base sm:text-sm"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">Incorrect password</p>
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
