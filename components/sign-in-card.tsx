'use client'

import { LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/useAuth'

export function SignInCard() {
  const { status, signIn } = useAuth('/projects')

  const handleSignIn = () => {
    void signIn()
  }

  return (
    <Card className="mx-auto w-full max-w-md border-primary/30 bg-background-elevated/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">Sign in to continue</CardTitle>
        <CardDescription className="text-foreground-muted">
          Connect your Google account to sync survey data and exports to
          <span className="ml-1 font-medium text-primary">/My Drive/SST/</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed text-foreground-muted">
        <p>
          We only request the scopes your surveys need:
          <code className="ml-2 inline-block rounded bg-background-elevated px-2 py-1 text-xs text-primary/90">
            openid email profile https://www.googleapis.com/auth/drive
          </code>
        </p>
        <p>
          Exports are written to folders named
          <span className="ml-1 font-medium text-foreground">
            {'<ProjectName>__<projectId>'}
          </span>
          with
          <code className="mx-1 inline-flex items-center rounded bg-background-elevated px-2 py-1 text-xs text-foreground">
            project.json
          </code>
          written last so your Drive stays consistent.
        </p>
        <Button
          className="mt-4 w-full gap-2 bg-primary hover:bg-primary/80"
          size="lg"
          onClick={handleSignIn}
          disabled={status === 'loading'}
        >
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  )
}
