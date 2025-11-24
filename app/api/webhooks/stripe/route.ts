import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            // For local development without CLI, you might want to bypass signature verification
            // But for security, we should enforce it. 
            // If secret is missing, we can't verify.
            console.warn('STRIPE_WEBHOOK_SECRET is missing. Skipping signature verification (NOT RECOMMENDED FOR PRODUCTION).')
            event = JSON.parse(body)
        } else {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            )
        }
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    // Use Service Role Key to bypass RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session
            const userId = session.client_reference_id
            const subscriptionId = session.subscription as string
            const customerId = session.customer as string

            if (userId) {
                await supabase
                    .from('profiles')
                    .update({
                        stripe_customer_id: customerId,
                        subscription_id: subscriptionId,
                        subscription_status: 'active', // Assuming successful checkout means active
                    })
                    .eq('id', userId)
            }
            break
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription
            const status = subscription.status
            const customerId = subscription.customer as string

            // Find user by stripe_customer_id
            // Note: This requires us to have saved the customer_id previously
            await supabase
                .from('profiles')
                .update({
                    subscription_status: status,
                })
                .eq('stripe_customer_id', customerId)
            break
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription
            const customerId = subscription.customer as string

            await supabase
                .from('profiles')
                .update({
                    subscription_status: 'canceled',
                })
                .eq('stripe_customer_id', customerId)
            break
        }
    }

    return new NextResponse(null, { status: 200 })
}
