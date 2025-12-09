import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
    try {
        // 1. Authenticate User
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // 2. Get Price ID from body
        const body = await req.json()
        const { priceId } = body

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 })
        }

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            tax_id_collection: {
                enabled: true,
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: user.email,
            client_reference_id: user.id, // Link Stripe Customer to Supabase User ID
            success_url: `${req.headers.get('origin')}/projects?success=true`,
            cancel_url: `${req.headers.get('origin')}/?canceled=true`,
            metadata: {
                userId: user.id,
            },
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
