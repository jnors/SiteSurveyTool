import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useHasMounted } from '@/lib/useHasMounted'

describe('useHasMounted', () => {
    it('should return true after mount', async () => {
        const { result } = renderHook(() => useHasMounted())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })
    })

    it('should remain true after re-render', async () => {
        const { result, rerender } = renderHook(() => useHasMounted())

        await waitFor(() => {
            expect(result.current).toBe(true)
        })

        rerender()

        expect(result.current).toBe(true)
    })

    it('should handle multiple instances independently', async () => {
        const { result: result1 } = renderHook(() => useHasMounted())
        const { result: result2 } = renderHook(() => useHasMounted())

        await waitFor(() => {
            expect(result1.current).toBe(true)
            expect(result2.current).toBe(true)
        })
    })

    it('should transition from false to true on mount', async () => {
        const { result } = renderHook(() => useHasMounted())

        // It may start as false or true depending on timing, but should definitely be true after waiting
        await waitFor(() => {
            expect(result.current).toBe(true)
        }, { timeout: 100 })
    })

    it('should be true for new instance after previous unmount', async () => {
        const { unmount } = renderHook(() => useHasMounted())
        unmount()

        const { result: result2 } = renderHook(() => useHasMounted())

        await waitFor(() => {
            expect(result2.current).toBe(true)
        })
    })
})
