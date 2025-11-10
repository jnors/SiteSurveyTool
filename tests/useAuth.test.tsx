import { renderHook, act } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/lib/useAuth'

vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual<typeof import('next-auth/react')>('next-auth/react')
  return {
    ...actual,
    signIn: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/lib/useOnline', () => ({
  useOnline: vi.fn(),
}))

let SessionContext: typeof import('next-auth/react')['SessionContext']
let signOut: typeof import('next-auth/react')['signOut']
let useOnline: typeof import('@/lib/useOnline')['useOnline']

beforeAll(async () => {
  const nextAuth = await import('next-auth/react')
  SessionContext = nextAuth.SessionContext
  signOut = nextAuth.signOut

  const onlineModule = await import('@/lib/useOnline')
  useOnline = onlineModule.useOnline
})

const SESSION_KEY = 'FieldPins:last-session'

function withSessionProvider(value: Parameters<typeof SessionContext.Provider>[0]['value']) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(SessionContext.Provider, { value }, children as ReactNode)
  }
}

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

    vi.mocked(useOnline).mockReturnValue(true)

    const wrapper = withSessionProvider({
      data: { user: { name: 'Test' } } as any,
      status: 'authenticated',
      update: async () => null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.signOut()
    })

    expect(signOut).toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})
