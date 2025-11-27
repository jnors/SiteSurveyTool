import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/stripe/route'

// Mock dependencies
vi.mock('next/headers', () => ({
    headers: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
    stripe: {
        webhooks: {
            constructEvent: vi.fn(),
        },
    },
}))

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(),
}))

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

describe('POST /api/webhooks/stripe', () => {
    const mockSupabaseUpdate = vi.fn().mockReturnThis()
    const mockSupabaseEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockSupabaseFrom = vi.fn(() => ({
        update: mockSupabaseUpdate,
    }))

    const mockSupabase = {
        from: mockSupabaseFrom,
    }

    const mockHeaders = {
        get: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(headers).mockResolvedValue(mockHeaders as any)
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)
        mockSupabaseUpdate.mockReturnValue({
            eq: mockSupabaseEq,
        })

        // Set environment variables
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    })

    describe('Signature Verification', () => {
        it('should verify webhook signature successfully', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        client_reference_id: 'user-123',
                        subscription: 'sub-123',
                        customer: 'cus-123',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
                expect.any(String),
                'test-signature',
                'whsec_test_secret'
            )
        })

        it('should return 400 for invalid signature', async () => {
            mockHeaders.get.mockReturnValue('invalid-signature')

            vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
                throw new Error('Invalid signature')
            })

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify({ type: 'test' }),
            })

            const response = await POST(req)

            expect(response.status).toBe(400)
            expect(await response.text()).toContain('Webhook Error: Invalid signature')
        })

        it('should skip verification when STRIPE_WEBHOOK_SECRET is missing', async () => {
            delete process.env.STRIPE_WEBHOOK_SECRET
            mockHeaders.get.mockReturnValue('some-signature')

            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        client_reference_id: 'user-123',
                        subscription: 'sub-123',
                        customer: 'cus-123',
                    },
                },
            }

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled()
        })
    })

    describe('checkout.session.completed Event', () => {
        it('should update profile with subscription details', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        client_reference_id: 'user-456',
                        subscription: 'sub-789',
                        customer: 'cus-abc',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                stripe_customer_id: 'cus-abc',
                subscription_id: 'sub-789',
                subscription_status: 'active',
            })
            expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'user-456')
        })

        it('should skip update if client_reference_id is missing', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        client_reference_id: null,
                        subscription: 'sub-789',
                        customer: 'cus-abc',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(mockSupabaseUpdate).not.toHaveBeenCalled()
        })
    })

    describe('customer.subscription.updated Event', () => {
        it('should update subscription status', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        customer: 'cus-123',
                        status: 'past_due',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                subscription_status: 'past_due',
            })
            expect(mockSupabaseEq).toHaveBeenCalledWith('stripe_customer_id', 'cus-123')
        })

        it('should handle active status update', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        customer: 'cus-456',
                        status: 'active',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            await POST(req)

            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                subscription_status: 'active',
            })
        })
    })

    describe('customer.subscription.deleted Event', () => {
        it('should set subscription status to canceled', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        customer: 'cus-789',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                subscription_status: 'canceled',
            })
            expect(mockSupabaseEq).toHaveBeenCalledWith('stripe_customer_id', 'cus-789')
        })
    })

    describe('Unknown Events', () => {
        it('should successfully handle unknown event types', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'unknown.event.type',
                data: {
                    object: {},
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            const response = await POST(req)

            expect(response.status).toBe(200)
            expect(mockSupabaseUpdate).not.toHaveBeenCalled()
        })
    })

    describe('Supabase Integration', () => {
        it('should create Supabase client with service role key', async () => {
            mockHeaders.get.mockReturnValue('test-signature')

            const mockEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        client_reference_id: 'user-123',
                        subscription: 'sub-123',
                        customer: 'cus-123',
                    },
                },
            }

            vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

            const req = new Request('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(mockEvent),
            })

            await POST(req)

            expect(createClient).toHaveBeenCalledWith(
                'https://test.supabase.co',
                'test-service-role-key',
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                }
            )
        })
    })
})
