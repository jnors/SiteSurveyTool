'use client'

import Link from 'next/link'
import { LogIn, LogOut, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'

export function NavBar() {
  const { isAuthenticated, user, status, signOut, signIn } = useAuth('/projects')

  const handleSignOut = () => {
    void signOut()
  }

  const handleSignIn = () => {
    void signIn()
  }

  const userLabel = user?.name ?? user?.email ?? 'Signed in'

  return (
    <nav className="border-b border-border bg-background-elevated">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/projects" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="font-bold text-sm">SST</span>
          </div>
          <span className="font-semibold text-lg text-foreground">Site Survey Tool</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm text-foreground-muted">
                <UserCircle className="h-4 w-4 text-primary" />
                <span className="truncate max-w-[160px]" title={userLabel}>
                  {userLabel}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-foreground-muted hover:text-foreground"
                onClick={handleSignOut}
                disabled={status === 'loading'}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/80"
              onClick={handleSignIn}
              disabled={status === 'loading'}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
