'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LogIn, LogOut, UserCircle, Crown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'

export function NavBar() {
  // Use default '/' for sign-out redirect; override sign-in to '/projects'
  const { isAuthenticated, user, status, signOut, signIn, subscriptionStatus } = useAuth()

  const handleSignOut = () => {
    void signOut('/')
  }

  const handleSignIn = () => {
    void signIn({ callbackUrl: '/projects' })
  }

  const userLabel = user?.user_metadata?.name ?? user?.email ?? 'Signed in'
  const isPro = subscriptionStatus === 'active'

  return (
    <nav className="border-b border-border bg-background-elevated">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/projects" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <Image src="/images/favicon.svg" alt="FieldPins logo" width={36} height={36} className="h-9 w-9" />
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">FieldPins</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${isPro ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30' : 'bg-background'}`}>
                <div className="relative">
                  <UserCircle className={`h-4 w-4 ${isPro ? 'text-primary' : 'text-primary'}`} />
                  {isPro && (
                    <Crown className="absolute -right-1 -top-1 h-3 w-3 text-primary" fill="currentColor" />
                  )}
                </div>
                <span className={`truncate max-w-[160px] ${isPro ? 'text-foreground font-medium' : 'text-foreground-muted'}`} title={userLabel}>
                  {userLabel}
                </span>
                {isPro && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                    PRO
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-foreground-muted hover:text-foreground"
                onClick={handleSignOut}
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
