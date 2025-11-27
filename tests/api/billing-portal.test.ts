import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/billing-portal/route'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
    stripe: {
        billingPortal: {
            sessions: {
                create: vi.fn(),
            },
        },
    },
}))

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

describe('POST /api/billing-portal', () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
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

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        expect(await response.text()).toBe('Unauthorized')
    })

    it('should return 400 if user has no Stripe customer ID', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        const mockSelect = vi.fn().mockReturnThis()
        const mockEq = vi.fn().mockReturnThis()
        const mockSingle = vi.fn().mockResolvedValue({
            data: null,
            error: null,
        })

        mockSupabase.from.mockReturnValue({
            select: mockSelect,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
        })
        mockEq.mockReturnValue({
            single: mockSingle,
        })

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        expect(await response.text()).toBe('No Stripe customer found')
    })

    it('should create billing portal session successfully', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        }

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        })

        const mockSelect = vi.fn().mockReturnThis()
        const mockEq = vi.fn().mockReturnThis()
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                stripe_customer_id: 'cus_123',
            },
            error: null,
        })

        mockSupabase.from.mockReturnValue({
            select: mockSelect,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
        })
        mockEq.mockReturnValue({
            single: mockSingle,
        })

        const mockPortalSession = {
            id: 'portal_session_123',
            url: 'https://billing.stripe.com/session_123',
        }

        vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue(mockPortalSession as any)

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.url).toBe('https://billing.stripe.com/session_123')
    })

    it('should pass correct customer ID to Stripe', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-456',
                    email: 'user@test.com',
                },
            },
            error: null,
        })

        const mockSelect = vi.fn().mockReturnThis()
        const mockEq = vi.fn().mockReturnThis()
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                stripe_customer_id: 'cus_456',
            },
            error: null,
        })

        mockSupabase.from.mockReturnValue({
            select: mockSelect,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
        })
        mockEq.mockReturnValue({
            single: mockSingle,
        })

        vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({
            id: 'portal_session_456',
            url: 'https://billing.stripe.com/session_456',
        } as any)

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        await POST(req)

        expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
            customer: 'cus_456',
            return_url: expect.stringContaining('/settings'),
        })
    })

    it('should use correct return URL', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        const mockSelect = vi.fn().mockReturnThis()
        const mockEq = vi.fn().mockReturnThis()
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                stripe_customer_id: 'cus_123',
            },
            error: null,
        })

        mockSupabase.from.mockReturnValue({
            select: mockSelect,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
        })
        mockEq.mockReturnValue({
            single: mockSingle,
        })

        vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({
            id: 'portal_session_123',
            url: 'https://billing.stripe.com/session_123',
        } as any)

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        await POST(req)

        const callArgs = vi.mocked(stripe.billingPortal.sessions.create).mock.calls[0][0]
        expect(callArgs.return_url).toMatch(/\/settings$/)
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

        const mockSelect = vi.fn().mockReturnThis()
        const mockEq = vi.fn().mockReturnThis()
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                stripe_customer_id: 'cus_123',
            },
            error: null,
        })

        mockSupabase.from.mockReturnValue({
            select: mockSelect,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
        })
        mockEq.mockReturnValue({
            single: mockSingle,
        })

        vi.mocked(stripe.billingPortal.sessions.create).mockRejectedValue(
            new Error('Stripe API error')
        )

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        expect(await response.text()).toBe('Internal Error')
    })

    it('should query correct profile table', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-789',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        const mockSelect = vi.fn().mockReturnThis()
        const mockEq = vi.fn().mockReturnThis()
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                stripe_customer_id: 'cus_789',
            },
            error: null,
        })

        mockSupabase.from.mockReturnValue({
            select: mockSelect,
        })
        mockSelect.mockReturnValue({
            eq: mockEq,
        })
        mockEq.mockReturnValue({
            single: mockSingle,
        })

        vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({
            id: 'portal_session_789',
            url: 'https://billing.stripe.com/session_789',
        } as any)

        const req = new Request('http://localhost:3000/api/billing-portal', {
            method: 'POST',
        })

        await POST(req)

        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(mockSelect).toHaveBeenCalledWith('stripe_customer_id')
        expect(mockEq).toHaveBeenCalledWith('id', 'user-789')
    })
})
