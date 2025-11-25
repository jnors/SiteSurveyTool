'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
}: {
    children: React.ReactNode
}) {
    const [supabase] = useState(() => createClient())
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
    const router = useRouter()

    const refreshSubscriptionStatus = async () => {
        console.log('🔄 [SupabaseProvider] refreshSubscriptionStatus called')
        // Use getSession instead of getUser to avoid network hangs
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
            console.error('❌ [SupabaseProvider] Error getting session:', sessionError)
            return
        }

        if (session?.user) {
            console.log('👤 [SupabaseProvider] User found:', session.user.id)

            try {
                // Race condition to prevent hang
                const { data, error } = await Promise.race([
                    supabase
                        .from('profiles')
                        .select('subscription_status')
                        .eq('id', session.user.id)
                        .single(),
                    new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timed out')), 5000))
                ])

                if (error) {
                    console.error('❌ [SupabaseProvider] Error fetching subscription status:', error)
                } else {
                    console.log('🔍 [SupabaseProvider] Refreshed subscription status:', data?.subscription_status)
                    // Cache status for faster load on next refresh
                    if (data?.subscription_status) {
                        localStorage.setItem('subscription_status', data.subscription_status)
                    } else {
                        localStorage.removeItem('subscription_status')
                    }
                }
                setSubscriptionStatus(data?.subscription_status ?? null)
            } catch (err) {
                console.error('❌ [SupabaseProvider] Profile fetch timed out or failed:', err)
            }
        } else {
            console.warn('⚠️ [SupabaseProvider] No user found in getSession()')
            setSubscriptionStatus(null)
            localStorage.removeItem('subscription_status')
        }
    }

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 [SupabaseProvider] Auth event:', event)
            if (session?.access_token !== session?.access_token) {
                router.refresh()
            }
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
                        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timed out')), 5000))
                    ])

                    if (error) {
                        console.error('❌ [SupabaseProvider] Error loading subscription status:', error)
                    } else {
                        console.log('🔍 [SupabaseProvider] Loaded subscription status:', data?.subscription_status)
                        // Cache status for faster load on next refresh
                        if (data?.subscription_status) {
                            localStorage.setItem('subscription_status', data.subscription_status)
                        } else {
                            localStorage.removeItem('subscription_status')
                        }
                    }
                    setSubscriptionStatus(data?.subscription_status ?? null)
                } catch (err) {
                    console.error('❌ [SupabaseProvider] Profile fetch timed out:', err)
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
                console.log('🔍 [SupabaseProvider] Detected checkout success, refreshing subscription...')
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
                console.log('⚡ [SupabaseProvider] Loaded cached subscription status:', cached)
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
