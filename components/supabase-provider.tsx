'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'

type SupabaseContext = {
    supabase: ReturnType<typeof createClient>
    session: Session | null
    user: User | null
    subscriptionStatus: string | null
    refreshSubscriptionStatus: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
    children,
    initialSession = null,
    initialSubscriptionStatus = null,
}: {
    children: React.ReactNode
    initialSession?: Session | null
    initialSubscriptionStatus?: string | null
}) {
    const [supabase] = useState(() => createClient())
    const [session, setSession] = useState<Session | null>(initialSession)
    const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(initialSubscriptionStatus)
    const router = useRouter()
    // Track previous user ID to detect account switches
    const previousUserIdRef = useRef<string | null>(initialSession?.user?.id ?? null)

    const refreshSubscriptionStatus = async () => {
        logger.debug('refreshSubscriptionStatus called')
        // Use getSession instead of getUser to avoid network hangs
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
            logger.error('Error getting session', sessionError)
            return
        }

        if (session?.user) {
            logger.debug('User found in refreshSubscriptionStatus', { userId: session.user.id })

            try {
                // Race condition to prevent hang
                const { data, error } = await Promise.race([
                    supabase
                        .from('profiles')
                        .select('subscription_status')
                        .eq('id', session.user.id)
                        .single(),
                    new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timed out')), 15000))
                ])

                if (error) {
                    logger.error('Error fetching subscription status', error)
                } else {
                    logger.debug('Refreshed subscription status', { status: data?.subscription_status })
                    // Cache status for faster load on next refresh
                    if (data?.subscription_status) {
                        localStorage.setItem('subscription_status', data.subscription_status)
                    } else {
                        localStorage.removeItem('subscription_status')
                    }
                }
                setSubscriptionStatus(data?.subscription_status ?? null)
            } catch (err) {
                logger.warn('Profile fetch timed out or failed', { error: err, userId: session.user.id })
            }
        } else {
            logger.warn('No user found in getSession()')
            setSubscriptionStatus(null)
            localStorage.removeItem('subscription_status')
        }
    }

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.access_token !== session?.access_token) {
                router.refresh()
            }

            // Detect account switch and clear IndexedDB for security
            const currentUserId = session?.user?.id ?? null
            const previousUserId = previousUserIdRef.current

            if (currentUserId && previousUserId && currentUserId !== previousUserId) {
                logger.auth('Account switch detected', {
                    previousUserId,
                    currentUserId
                })
                try {
                    logger.auth('Clearing IndexedDB due to account switch...')
                    await db.delete()
                    logger.auth('IndexedDB cleared successfully')
                } catch (dbError) {
                    logger.error('Error clearing IndexedDB on account switch', dbError)
                }
            }

            // Update the ref for next comparison
            previousUserIdRef.current = currentUserId

            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                try {
                    const { data, error } = await Promise.race([
                        supabase
                            .from('profiles')
                            .select('subscription_status')
                            .eq('id', session.user.id)
                            .single(),
                        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timed out')), 15000))
                    ])

                    if (error) {
                        logger.error('Error loading subscription status', error)
                    } else {
                        // Cache status for faster load on next refresh
                        if (data?.subscription_status) {
                            localStorage.setItem('subscription_status', data.subscription_status)
                        } else {
                            localStorage.removeItem('subscription_status')
                        }
                    }
                    setSubscriptionStatus(data?.subscription_status ?? null)
                } catch (err) {
                    logger.warn('Profile fetch timed out', { error: err, userId: session?.user?.id })
                    // Don't clear status on timeout if we have a cache
                }
            } else {
                setSubscriptionStatus(null)
                localStorage.removeItem('subscription_status')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router, supabase])

    // Refresh subscription status when returning from Stripe checkout
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('success') === 'true') {
                logger.debug('Detected checkout success, refreshing subscription...')
                refreshSubscriptionStatus()
                // Clean up the URL
                window.history.replaceState({}, '', window.location.pathname)
            }
        }
    }, [])

    // Load cached subscription status on mount for instant UI
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('subscription_status')
            if (cached) {
                logger.debug('Loaded cached subscription status', { status: cached })
                setSubscriptionStatus(cached)
            }
        }
    }, [])

    return (
        <Context.Provider value={{ supabase, session, user, subscriptionStatus, refreshSubscriptionStatus }}>
            {children}
        </Context.Provider>
    )
}

export const useSupabase = () => {
    const context = useContext(Context)
    if (context === undefined) {
        throw new Error('useSupabase must be used inside SupabaseProvider')
    }
    return context
}
