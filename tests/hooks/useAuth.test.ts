import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth } from '@/lib/useAuth'
import * as supabaseProvider from '@/components/supabase-provider'

// Mock the supabase provider
vi.mock('@/components/supabase-provider', () => ({
    useSupabase: vi.fn(),
}))

describe('useAuth', () => {
    const mockSupabaseAuth = {
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
    }

    const mockSupabase = {
        auth: mockSupabaseAuth,
    }

    const mockRefreshSubscriptionStatus = vi.fn()

    const defaultMockReturn = {
        supabase: mockSupabase,
        session: null,
        user: null,
        subscriptionStatus: null,
        refreshSubscriptionStatus: mockRefreshSubscriptionStatus,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(supabaseProvider.useSupabase).mockReturnValue(defaultMockReturn)

        // Mock window.location
        delete (window as any).location
        window.location = { href: '', origin: 'http://localhost:3000' } as any

        // Mock localStorage
        const localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            key: vi.fn(),
            length: 0,
        }
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Authentication State', () => {
        it('should return unauthenticated status when no session', () => {
            const { result } = renderHook(() => useAuth('/'))

            expect(result.current.status).toBe('unauthenticated')
            expect(result.current.isAuthenticated).toBe(false)
            expect(result.current.user).toBeNull()
            expect(result.current.accessToken).toBeUndefined()
        })

        it('should return authenticated status when session exists', () => {
            const mockSession = {
                access_token: 'mock-access-token',
                provider_token: 'mock-provider-token',
                provider_refresh_token: 'mock-refresh-token',
                expires_at: 1234567890,
            }

            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            }

            vi.mocked(supabaseProvider.useSupabase).mockReturnValue({
                ...defaultMockReturn,
                session: mockSession as any,
                user: mockUser as any,
            })

            const { result } = renderHook(() => useAuth('/'))

            expect(result.current.status).toBe('authenticated')
            expect(result.current.isAuthenticated).toBe(true)
            expect(result.current.user).toEqual(mockUser)
            expect(result.current.accessToken).toBe('mock-provider-token')
            expect(result.current.refreshToken).toBe('mock-refresh-token')
            expect(result.current.expiresAt).toBe(1234567890)
        })

        it('should return subscription status from provider', () => {
            vi.mocked(supabaseProvider.useSupabase).mockReturnValue({
                ...defaultMockReturn,
                subscriptionStatus: 'active',
            })

            const { result } = renderHook(() => useAuth('/'))

            expect(result.current.subscriptionStatus).toBe('active')
        })
    })

    describe('Sign In', () => {
        it('should call supabase signInWithOAuth with correct parameters', async () => {
            const { result } = renderHook(() => useAuth('/dashboard'))

            await act(async () => {
                await result.current.signIn()
            })

            expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: 'http://localhost:3000/auth/callback',
                    scopes: expect.any(String),
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                },
            })
        })

        it('should use custom callback URL when provided', async () => {
            const { result } = renderHook(() => useAuth('/custom-callback'))

            await act(async () => {
                await result.current.signIn({ callbackUrl: '/custom-path' })
            })

            expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalled()
        })

        it('should include Google Drive scopes', async () => {
            const { result } = renderHook(() => useAuth('/'))

            await act(async () => {
                await result.current.signIn()
            })

            const callArgs = mockSupabaseAuth.signInWithOAuth.mock.calls[0][0]
            expect(callArgs.options.scopes).toContain('https://www.googleapis.com/auth/drive')
        })
    })

    describe('Sign Out', () => {
        it('should call supabase signOut successfully', async () => {
            mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

            const { result } = renderHook(() => useAuth('/'))

            await act(async () => {
                result.current.signOut()
            })

            await waitFor(() => {
                expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
            })
        })

        it('should clear localStorage on signOut error', async () => {
            mockSupabaseAuth.signOut.mockRejectedValue(new Error('Sign out failed'))

            const mockLocalStorage = {
                key: vi.fn((index) => {
                    const keys = ['sb-test-auth-token', 'other-key', 'sb-another-auth-token']
                    return keys[index] || null
                }),
                removeItem: vi.fn(),
                length: 3,
            }
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            })

            const { result } = renderHook(() => useAuth('/'))

            await act(async () => {
                result.current.signOut()
            })

            await waitFor(() => {
                expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-test-auth-token')
                expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sb-another-auth-token')
                expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('subscription_status')
            })
        })

        it('should redirect to signout route after clearing storage', async () => {
            mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

            const { result } = renderHook(() => useAuth('/'))

            await act(async () => {
                result.current.signOut()
            })

            await waitFor(() => {
                expect(window.location.href).toBe('/auth/signout')
            })
        })

        it('should handle timeout and force clear storage', async () => {
            // Make signOut hang forever
            mockSupabaseAuth.signOut.mockImplementation(
                () => new Promise(() => { }) // Never resolves
            )

            const mockLocalStorage = {
                key: vi.fn(() => 'sb-test-auth-token'),
                removeItem: vi.fn(),
                length: 1,
            }
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            })

            const { result } = renderHook(() => useAuth('/'))

            await act(async () => {
                result.current.signOut()
            })

            await waitFor(
                () => {
                    expect(mockLocalStorage.removeItem).toHaveBeenCalled()
                },
                { timeout: 3000 }
            )
        })
    })

    describe('Refresh Subscription Status', () => {
        it('should expose refreshSubscriptionStatus function', () => {
            const { result } = renderHook(() => useAuth('/'))

            expect(result.current.refreshSubscriptionStatus).toBe(mockRefreshSubscriptionStatus)
        })

        it('should call refresh function when invoked', async () => {
            const { result } = renderHook(() => useAuth('/'))

            await act(async () => {
                await result.current.refreshSubscriptionStatus()
            })

            expect(mockRefreshSubscriptionStatus).toHaveBeenCalled()
        })
    })

    describe('Error Handling', () => {
        it('should always return null for error field', () => {
            const { result } = renderHook(() => useAuth('/'))

            expect(result.current.error).toBeNull()
        })
    })
})
