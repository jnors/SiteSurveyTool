'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LogIn, LogOut, UserCircle, Crown, Settings, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    <nav className="sticky top-0 z-40 border-b border-border bg-background-elevated">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/projects" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <Image src="/images/favicon.svg" alt="FieldPins logo" width={36} height={36} className="h-9 w-9" />
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">FieldPins</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-full justify-start gap-2 rounded-full px-3 hover:bg-muted/50 md:w-auto">
                    <div className={`flex items-center gap-2 ${isPro ? 'text-primary' : 'text-foreground'}`}>
                      <div className="relative">
                        <UserCircle className="h-5 w-5" />
                        {isPro && (
                          <Crown className="absolute -right-1 -top-1 h-3 w-3 fill-current text-primary" />
                        )}
                      </div>
                      <span className="hidden max-w-[120px] truncate font-medium md:inline-block" title={userLabel}>
                        {userLabel}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="mailto:hello@sitetrace.app?subject=SiteSurveyTool%20Feedback" className="cursor-pointer w-full flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Feedback
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
