import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIsMobile } from '@/hooks/use-mobile'

describe('useIsMobile', () => {
    const MOBILE_BREAKPOINT = 768

    beforeEach(() => {
        // Mock window.innerWidth
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        })

        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should return false for desktop width', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 1024,
        })

        const { result } = renderHook(() => useIsMobile())

        await waitFor(() => {
            expect(result.current).toBe(false)
        })
    })

    it('should return true for mobile width', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 375,
        })

        const { result } = renderHook(() => useIsMobile())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })
    })

    it('should return true at breakpoint boundary (767px)', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: MOBILE_BREAKPOINT - 1,
        })

        const { result } = renderHook(() => useIsMobile())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })
    })

    it('should return false at breakpoint (768px)', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: MOBILE_BREAKPOINT,
        })

        const { result } = renderHook(() => useIsMobile())

        await waitFor(() => {
            expect(result.current).toBe(false)
        })
    })

    it('should update when window is resized to mobile', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 1024,
        })

        let changeListener: ((event: any) => void) | null = null

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: false,
                media: '',
                addEventListener: vi.fn((event, listener) => {
                    if (event === 'change') {
                        changeListener = listener
                    }
                }),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })

        const { result } = renderHook(() => useIsMobile())

        await waitFor(() => {
            expect(result.current).toBe(false)
        })

        // Simulate resize to mobile
        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                value: 375,
            })
            if (changeListener) {
                changeListener({} as any)
            }
        })

        await waitFor(() => {
            expect(result.current).toBe(true)
        })
    })

    it('should update when window is resized to desktop', async () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 375,
        })

        let changeListener: ((event: any) => void) | null = null

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: true,
                media: '',
                addEventListener: vi.fn((event, listener) => {
                    if (event === 'change') {
                        changeListener = listener
                    }
                }),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })

        const { result } = renderHook(() => useIsMobile())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })

        // Simulate resize to desktop
        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                value: 1024,
            })
            if (changeListener) {
                changeListener({} as any)
            }
        })

        await waitFor(() => {
            expect(result.current).toBe(false)
        })
    })

    it('should cleanup media query listener on unmount', () => {
        const removeEventListenerSpy = vi.fn()

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: false,
                media: '',
                addEventListener: vi.fn(),
                removeEventListener: removeEventListenerSpy,
                dispatchEvent: vi.fn(),
            })),
        })

        const { unmount } = renderHook(() => useIsMobile())

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should handle common mobile device widths', async () => {
        const mobileWidths = [320, 375, 414, 390, 428] // Common mobile widths

        for (const width of mobileWidths) {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                value: width,
            })

            const { result } = renderHook(() => useIsMobile())

            await waitFor(() => {
                expect(result.current).toBe(true)
            })
        }
    })

    it('should handle common tablet/desktop widths', async () => {
        const desktopWidths = [768, 1024, 1280, 1440, 1920] // Common desktop widths

        for (const width of desktopWidths) {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                value: width,
            })

            const { result } = renderHook(() => useIsMobile())

            await waitFor(() => {
                expect(result.current).toBe(false)
            })
        }
    })
})
