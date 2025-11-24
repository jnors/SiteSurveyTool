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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('subscription_status')
                .eq('id', user.id)
                .single()
            console.log('🔍 [SupabaseProvider] Refreshed subscription status:', data?.subscription_status)
            setSubscriptionStatus(data?.subscription_status ?? null)
        }
    }

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.access_token !== session?.access_token) {
                router.refresh()
            }
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('subscription_status')
                    .eq('id', session.user.id)
                    .single()
                console.log('🔍 [SupabaseProvider] Loaded subscription status:', data?.subscription_status)
                setSubscriptionStatus(data?.subscription_status ?? null)
            } else {
                setSubscriptionStatus(null)
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
