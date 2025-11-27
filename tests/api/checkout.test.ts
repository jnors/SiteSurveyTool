import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/checkout/route'
import { NextResponse } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
    stripe: {
        checkout: {
            sessions: {
                create: vi.fn(),
            },
        },
    },
}))

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

describe('POST /api/checkout', () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(),
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    })

    it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        })

        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            body: JSON.stringify({ priceId: 'price_123' }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        expect(await response.text()).toBe('Unauthorized')
    })

    it('should return 400 if priceId is missing', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            body: JSON.stringify({}),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        expect(await response.text()).toBe('Price ID is required')
    })

    it('should create checkout session successfully', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        }

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        })

        const mockSession = {
            id: 'session_123',
            url: 'https://checkout.stripe.com/session_123',
        }

        vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as any)

        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: {
                origin: 'http://localhost:3000',
            },
            body: JSON.stringify({ priceId: 'price_monthly_123' }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.url).toBe('https://checkout.stripe.com/session_123')
    })

    it('should pass correct parameters to Stripe', async () => {
        const mockUser = {
            id: 'user-456',
            email: 'user@test.com',
        }

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        })

        vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
            id: 'session_456',
            url: 'https://checkout.stripe.com/session_456',
        } as any)

        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: {
                origin: 'http://localhost:3000',
            },
            body: JSON.stringify({ priceId: 'price_annual_789' }),
        })

        await POST(req)

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: 'price_annual_789',
                    quantity: 1,
                },
            ],
            customer_email: 'user@test.com',
            client_reference_id: 'user-456',
            success_url: 'http://localhost:3000/projects?success=true',
            cancel_url: 'http://localhost:3000/?canceled=true',
            metadata: {
                userId: 'user-456',
            },
        })
    })

    it('should handle Stripe errors gracefully', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(
            new Error('Stripe API error')
        )

        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            body: JSON.stringify({ priceId: 'price_123' }),
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        expect(await response.text()).toBe('Internal Error')
    })

    it('should use origin header for redirect URLs', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
            id: 'session_123',
            url: 'https://checkout.stripe.com/session_123',
        } as any)

        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: {
                origin: 'https://myapp.com',
            },
            body: JSON.stringify({ priceId: 'price_123' }),
        })

        await POST(req)

        const callArgs = vi.mocked(stripe.checkout.sessions.create).mock.calls[0][0]
        expect(callArgs.success_url).toBe('https://myapp.com/projects?success=true')
        expect(callArgs.cancel_url).toBe('https://myapp.com/?canceled=true')
    })
})
