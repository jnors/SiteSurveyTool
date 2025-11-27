import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useOnline } from '@/lib/useOnline'

describe('useOnline', () => {
    beforeEach(() => {
        // Mock window.navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should initialize with navigator.onLine value', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        })

        const { result } = renderHook(() => useOnline())

        waitFor(() => {
            expect(result.current).toBe(false)
        })
    })

    it('should return true when online', async () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        })

        const { result } = renderHook(() => useOnline())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })
    })

    it('should update when going offline', async () => {
        const { result } = renderHook(() => useOnline())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })

        // Simulate going offline
        act(() => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            })
            window.dispatchEvent(new Event('offline'))
        })

        await waitFor(() => {
            expect(result.current).toBe(false)
        })
    })

    it('should update when coming back online', async () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        })

        const { result } = renderHook(() => useOnline())

        await waitFor(() => {
            expect(result.current).toBe(false)
        })

        // Simulate coming back online
        act(() => {
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true,
            })
            window.dispatchEvent(new Event('online'))
        })

        await waitFor(() => {
            expect(result.current).toBe(true)
        })
    })

    it('should handle rapid online/offline transitions', async () => {
        const { result } = renderHook(() => useOnline())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })

        // Go offline
        act(() => {
            window.dispatchEvent(new Event('offline'))
        })

        await waitFor(() => {
            expect(result.current).toBe(false)
        })

        // Come back online
        act(() => {
            window.dispatchEvent(new Event('online'))
        })

        await waitFor(() => {
            expect(result.current).toBe(true)
        })

        // Go offline again
        act(() => {
            window.dispatchEvent(new Event('offline'))
        })

        await waitFor(() => {
            expect(result.current).toBe(false)
        })
    })

    it('should cleanup event listeners on unmount', async () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

        const { unmount } = renderHook(() => useOnline())

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
        expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should not update after unmount', async () => {
        const { result, unmount } = renderHook(() => useOnline())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })

        unmount()

        // Try to trigger event after unmount - should not cause errors
        act(() => {
            window.dispatchEvent(new Event('offline'))
        })

        // Should still be true (last value before unmount)
        expect(result.current).toBe(true)
    })
})
