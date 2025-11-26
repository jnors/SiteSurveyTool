import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectSync } from '@/hooks/useProjectSync'
import type { ProjectSyncSummary } from '@/lib/sync'

describe('useProjectSync', () => {
    const mockSyncAll = vi.fn()
    const mockRecreateProjectFolder = vi.fn()
    const mockRelinkProjectFolder = vi.fn()
    const mockOnToast = vi.fn()

    const defaultProps = {
        syncAll: mockSyncAll,
        recreateProjectFolder: mockRecreateProjectFolder,
        relinkProjectFolder: mockRelinkProjectFolder,
        onToast: mockOnToast,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with empty state', () => {
        const { result } = renderHook(() => useProjectSync(defaultProps))

        expect(result.current.issues).toEqual([])
        expect(result.current.issuesOpen).toBe(false)
        expect(result.current.relinkTarget).toBeNull()
        expect(result.current.relinkInput).toBe('')
        expect(result.current.relinkError).toBeNull()
        expect(result.current.isRelinking).toBe(false)
    })

    it('should handle successful sync with no issues', async () => {
        const mockResult = {
            movedOrMissing: [],
            projectSummaries: [
                {
                    projectId: 'project1',
                    projectName: 'Test Project',
                    photoStats: { total: 5, success: 5, failed: 0 },
                    floorplanUploaded: true,
                    projectJsonWritten: true,
                    errors: [],
                } as ProjectSyncSummary,
            ],
            errors: 0,
        }

        mockSyncAll.mockResolvedValue(mockResult)

        const { result } = renderHook(() => useProjectSync(defaultProps))

        await act(async () => {
            await result.current.handleSyncAll()
        })

        expect(result.current.issues).toEqual([])
        expect(result.current.issuesOpen).toBe(false)
        expect(mockOnToast).toHaveBeenCalledWith(expect.stringContaining('Synced 1 project'))
    })

    it('should handle sync with moved or missing folders', async () => {
        const mockIssues = [
            { projectId: 'project1', projectName: 'Test Project 1' },
            { projectId: 'project2', projectName: 'Test Project 2' },
        ]

        const mockResult = {
            movedOrMissing: mockIssues,
            projectSummaries: [],
            errors: 0,
        }

        mockSyncAll.mockResolvedValue(mockResult)

        const { result } = renderHook(() => useProjectSync(defaultProps))

        await act(async () => {
            await result.current.handleSyncAll()
        })

        expect(result.current.issues).toEqual(mockIssues)
        expect(result.current.issuesOpen).toBe(true)
    })

    it('should handle recreate folder operation', async () => {
        const mockSummary: ProjectSyncSummary = {
            projectId: 'project1',
            projectName: 'Test Project',
            photoStats: { total: 0, success: 0, failed: 0 },
            floorplanUploaded: false,
            projectJsonWritten: true,
            errors: [],
        }

        mockRecreateProjectFolder.mockResolvedValue(mockSummary)

        const { result } = renderHook(() => useProjectSync(defaultProps))

        // Set up initial issues
        await act(async () => {
            const mockResult = {
                movedOrMissing: [{ projectId: 'project1', projectName: 'Test Project' }],
                projectSummaries: [],
                errors: 0,
            }
            mockSyncAll.mockResolvedValue(mockResult)
            await result.current.handleSyncAll()
        })

        // Recreate folders
        await act(async () => {
            await result.current.handleRecreate()
        })

        expect(result.current.issues).toEqual([])
        expect(result.current.issuesOpen).toBe(false)
        expect(mockOnToast).toHaveBeenCalledWith(expect.stringContaining('1 project'))
    })

    it('should handle relink operation successfully', async () => {
        mockRelinkProjectFolder.mockResolvedValue(undefined)

        const { result } = renderHook(() => useProjectSync(defaultProps))

        const mockIssue = { projectId: 'project1', projectName: 'Test Project' }

        // Set up issues
        await act(async () => {
            const mockResult = {
                movedOrMissing: [mockIssue],
                projectSummaries: [],
                errors: 0,
            }
            mockSyncAll.mockResolvedValue(mockResult)
            await result.current.handleSyncAll()
        })

        // Open relink dialog
        act(() => {
            result.current.openRelinkDialog(mockIssue)
        })

        expect(result.current.relinkTarget).toEqual(mockIssue)

        // Set input
        act(() => {
            result.current.setRelinkInput('https://drive.google.com/drive/folders/abc123')
        })

        // Perform relink
        await act(async () => {
            await result.current.handleRelink()
        })

        expect(mockRelinkProjectFolder).toHaveBeenCalledWith('project1', 'https://drive.google.com/drive/folders/abc123')
        expect(result.current.relinkTarget).toBeNull()
        expect(result.current.relinkInput).toBe('')
        expect(result.current.issues).toEqual([])
        expect(mockOnToast).toHaveBeenCalledWith('Drive folder relinked. Ready to sync.')
    })

    it('should handle relink operation with error', async () => {
        const mockError = new Error('Failed to relink folder')
        mockRelinkProjectFolder.mockRejectedValue(mockError)

        const { result } = renderHook(() => useProjectSync(defaultProps))

        const mockIssue = { projectId: 'project1', projectName: 'Test Project' }

        // Open relink dialog
        act(() => {
            result.current.openRelinkDialog(mockIssue)
        })

        // Perform relink
        await act(async () => {
            await result.current.handleRelink()
        })

        expect(result.current.relinkError).toBe('Failed to relink folder')
        expect(result.current.isRelinking).toBe(false)
    })

    it('should close relink dialog', () => {
        const { result } = renderHook(() => useProjectSync(defaultProps))

        const mockIssue = { projectId: 'project1', projectName: 'Test Project' }

        act(() => {
            result.current.openRelinkDialog(mockIssue)
            result.current.setRelinkInput('some-input')
        })

        expect(result.current.relinkTarget).not.toBeNull()

        act(() => {
            result.current.closeRelinkDialog()
        })

        expect(result.current.relinkTarget).toBeNull()
        expect(result.current.relinkInput).toBe('')
        expect(result.current.relinkError).toBeNull()
        expect(result.current.isRelinking).toBe(false)
    })

    it('should build correct summary message', async () => {
        const mockResult = {
            movedOrMissing: [],
            projectSummaries: [
                {
                    projectId: 'project1',
                    projectName: 'Test Project',
                    photoStats: { total: 10, success: 8, failed: 2 },
                    floorplanUploaded: true,
                    projectJsonWritten: true,
                    errors: [],
                } as ProjectSyncSummary,
            ],
            errors: 1,
        }

        mockSyncAll.mockResolvedValue(mockResult)

        const { result } = renderHook(() => useProjectSync(defaultProps))

        await act(async () => {
            await result.current.handleSyncAll()
        })

        expect(mockOnToast).toHaveBeenCalledWith(
            expect.stringMatching(/Synced 1 project.*8\/10 photos.*2 failed.*1 project\.json.*\(1 error\)/)
        )
    })
})
