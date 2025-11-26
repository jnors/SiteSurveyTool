import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectRestore } from '@/hooks/useProjectRestore'
import * as restoreModule from '@/lib/restore'

// Mock the restore module
vi.mock('@/lib/restore', () => ({
    restoreFromDrive: vi.fn(),
}))

describe('useProjectRestore', () => {
    const mockRefresh = vi.fn()
    const mockOnToast = vi.fn()

    const defaultProps = {
        isAuthenticated: true,
        isLoading: false,
        projectCount: 0,
        isOnline: true,
        refresh: mockRefresh,
        onToast: mockOnToast,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with default state', () => {
        const props = { ...defaultProps, isAuthenticated: false }
        const { result } = renderHook(() => useProjectRestore(props))

        expect(result.current.isRestoring).toBe(false)
        expect(result.current.restoreProgress).toBeNull()
    })

    it('should trigger auto-restore when conditions are met', async () => {
        const mockRestoreResult = {
            projectsRestored: 3,
            errors: [],
        }

        vi.mocked(restoreModule.restoreFromDrive).mockImplementation(async (onProgress) => {
            onProgress?.({
                phase: 'discovering',
                message: 'Discovering projects...',
                projectsTotal: 0,
                projectsCompleted: 0,
            })
            return mockRestoreResult
        })

        const { result } = renderHook(() => useProjectRestore(defaultProps))

        await waitFor(() => {
            expect(result.current.isRestoring).toBe(false)
        })

        expect(restoreModule.restoreFromDrive).toHaveBeenCalled()
        expect(mockOnToast).toHaveBeenCalledWith('Restored 3 projects from Drive')
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('should not trigger auto-restore when user is not authenticated', () => {
        const props = { ...defaultProps, isAuthenticated: false }
        renderHook(() => useProjectRestore(props))

        expect(restoreModule.restoreFromDrive).not.toHaveBeenCalled()
    })

    it('should not trigger auto-restore when loading', () => {
        const props = { ...defaultProps, isLoading: true }
        renderHook(() => useProjectRestore(props))

        expect(restoreModule.restoreFromDrive).not.toHaveBeenCalled()
    })

    it('should not trigger auto-restore when projects exist', () => {
        const props = { ...defaultProps, projectCount: 2 }
        renderHook(() => useProjectRestore(props))

        expect(restoreModule.restoreFromDrive).not.toHaveBeenCalled()
    })

    it('should not trigger auto-restore when offline', () => {
        const props = { ...defaultProps, isOnline: false }
        renderHook(() => useProjectRestore(props))

        expect(restoreModule.restoreFromDrive).not.toHaveBeenCalled()
    })

    it('should handle restore with errors', async () => {
        const mockRestoreResult = {
            projectsRestored: 2,
            errors: ['Error 1', 'Error 2'],
        }

        vi.mocked(restoreModule.restoreFromDrive).mockResolvedValue(mockRestoreResult)

        const { result } = renderHook(() => useProjectRestore(defaultProps))

        await waitFor(() => {
            expect(result.current.isRestoring).toBe(false)
        })

        expect(mockOnToast).toHaveBeenCalledWith('Restored 2 projects with 2 errors')
    })

    it('should handle restore failure', async () => {
        const mockError = new Error('Network error')
        vi.mocked(restoreModule.restoreFromDrive).mockRejectedValue(mockError)

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        const { result } = renderHook(() => useProjectRestore(defaultProps))

        await waitFor(() => {
            expect(result.current.isRestoring).toBe(false)
        })

        expect(mockOnToast).toHaveBeenCalledWith('Failed to restore projects from Drive')
        expect(consoleSpy).toHaveBeenCalled()

        consoleSpy.mockRestore()
    })

    it('should update progress during restore', async () => {
        const progressUpdates: any[] = []

        vi.mocked(restoreModule.restoreFromDrive).mockImplementation(async (onProgress) => {
            if (onProgress) {
                onProgress({
                    phase: 'discovering',
                    message: 'Discovering projects...',
                    projectsTotal: 0,
                    projectsCompleted: 0,
                })

                onProgress({
                    phase: 'restoring',
                    message: 'Restoring project 1...',
                    projectsTotal: 3,
                    projectsCompleted: 1,
                })
            }
            return { projectsRestored: 3, errors: [] }
        })

        const { result } = renderHook(() => useProjectRestore(defaultProps))

        await waitFor(() => {
            expect(result.current.isRestoring).toBe(false)
        })

        expect(restoreModule.restoreFromDrive).toHaveBeenCalled()
    })

    it('should not trigger restore twice', async () => {
        vi.mocked(restoreModule.restoreFromDrive).mockResolvedValue({
            projectsRestored: 1,
            errors: [],
        })

        const { rerender } = renderHook(
            (props) => useProjectRestore(props),
            { initialProps: defaultProps }
        )

        await waitFor(() => {
            expect(restoreModule.restoreFromDrive).toHaveBeenCalledTimes(1)
        })

        // Rerender with same props - should not trigger again
        rerender(defaultProps)

        await waitFor(() => {
            expect(restoreModule.restoreFromDrive).toHaveBeenCalledTimes(1)
        })
    })

    it('should show no message when no projects are restored', async () => {
        vi.mocked(restoreModule.restoreFromDrive).mockResolvedValue({
            projectsRestored: 0,
            errors: [],
        })

        const { result } = renderHook(() => useProjectRestore(defaultProps))

        await waitFor(() => {
            expect(result.current.isRestoring).toBe(false)
        })

        expect(mockOnToast).not.toHaveBeenCalled()
    })
})
