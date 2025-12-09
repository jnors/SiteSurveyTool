import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (!profile?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No Stripe customer found' },
                { status: 400 }
            )
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('[billing-portal] Error:', error)

        // Handle stale customer ID (e.g. from switching between Test/Live mode)
        if (error?.code === 'resource_missing' || (error?.message && error.message.includes('No such customer'))) {
            try {
                const supabase = await createClient()
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (user) {
                    await supabase
                        .from('profiles')
                        .update({
                            stripe_customer_id: null,
                            subscription_status: null,
                            subscription_id: null
                        })
                        .eq('id', user.id)
                }
                return NextResponse.json(
                    { error: 'Subscription data was invalid and has been reset. Please refresh the page and subscribe again.' },
                    { status: 400 } // Use 400 so client alerts the message
                )
            } catch (dbError) {
                console.error('Failed to reset profile:', dbError)
            }
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
