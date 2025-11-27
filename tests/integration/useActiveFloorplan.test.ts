import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActiveFloorplan } from '@/lib/hooks/use-projects'

// Mock next/navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
    usePathname: () => '/projects/123',
    useSearchParams: () => mockSearchParams,
}))

describe('useActiveFloorplan Integration Tests', () => {
    const floorplans = [
        { id: 'fp-1', name: 'Floor 1' },
        { id: 'fp-2', name: 'Floor 2' },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        mockSearchParams = new URLSearchParams()
        window.history.replaceState(null, '', '/')
    })

    it('should default to first floorplan when no param exists', () => {
        const { result } = renderHook(() => useActiveFloorplan(floorplans))

        expect(result.current.activeFloorplanId).toBe('fp-1')
    })

    it('should use floorplan from URL param', () => {
        window.history.replaceState(null, '', '?fp=fp-2')
        mockSearchParams.set('fp', 'fp-2')

        const { result } = renderHook(() => useActiveFloorplan(floorplans))

        expect(result.current.activeFloorplanId).toBe('fp-2')
    })

    it('should update URL when setting active floorplan', () => {
        const { result } = renderHook(() => useActiveFloorplan(floorplans))

        act(() => {
            result.current.setActiveFloorplanId('fp-2')
        })

        expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('fp=fp-2'), expect.anything())
    })

    it('should handle empty floorplans array', () => {
        const { result } = renderHook(() => useActiveFloorplan([]))

        expect(result.current.activeFloorplanId).toBeNull()
    })

    it('should fallback to first floorplan if param ID not found', () => {
        mockSearchParams.set('fp', 'non-existent')

        const { result } = renderHook(() => useActiveFloorplan(floorplans))

        expect(result.current.activeFloorplanId).toBe('fp-1')
    })
})
