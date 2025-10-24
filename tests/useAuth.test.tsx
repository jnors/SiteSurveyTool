import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/lib/useAuth'

vi.mock('next-auth/react', () => {
  return {
    useSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/lib/useOnline', () => ({
  useOnline: vi.fn(),
}))

const { useSession, signOut } = await import('next-auth/react')
const { useOnline } = await import('@/lib/useOnline')

const SESSION_KEY = 'sst:last-session'

beforeEach(() => {
  sessionStorage.clear()
  vi.resetAllMocks()
})

describe('useAuth', () => {
  it('falls back to cached session when offline', () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user: { name: 'Offline User', email: 'offline@example.com' } }),
    )

    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any)
    vi.mocked(useOnline).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toMatchObject({ name: 'Offline User' })
  })

  it('clears cached session on signOut', async () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user: { name: 'Test', email: 'test@example.com' } }),
    )

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test' } },
      status: 'authenticated',
    } as any)
    vi.mocked(useOnline).mockReturnValue(true)

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.signOut()
    })

    expect(signOut).toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})
