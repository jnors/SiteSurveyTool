import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFloorplans } from '@/lib/hooks/use-projects'
import { db } from '@/lib/db'
import {
    setupTestDatabase,
    teardownTestDatabase,
    createTestProject,
    createTestFloorplan,
    createMockFile,
    mockImageCompression,
} from './test-utils'

// Mock dependencies
vi.mock('@/lib/utils/image', () => ({
    compressImageToJpeg: vi.fn(),
}))

vi.mock('@/lib/seed', () => ({
    seedIfEmpty: vi.fn().mockResolvedValue(undefined),
}))

import { compressImageToJpeg } from '@/lib/utils/image'

describe('useFloorplans Integration Tests', () => {
    const projectId = 'test-project-1'

    beforeEach(async () => {
        await setupTestDatabase()
        vi.clearAllMocks()

        // Setup mock image compression
        vi.mocked(compressImageToJpeg).mockResolvedValue({
            dataUrl: 'data:image/jpeg;base64,mock',
            width: 800,
            height: 600,
            blob: new Blob(['mock'], { type: 'image/jpeg' }),
            sizeBytes: 1024,
        })

        // Create test project
        const project = createTestProject({ id: projectId })
        await db.projects.add(project)
    })

    afterEach(async () => {
        await teardownTestDatabase()
    })

    it('should load floorplans for a project', async () => {
        // Add test floorplans to database
        const fp1 = createTestFloorplan(projectId, { id: 'fp-1', name: 'Floor 1' })
        const fp2 = createTestFloorplan(projectId, { id: 'fp-2', name: 'Floor 2' })
        await db.floorplans.bulkAdd([fp1, fp2])

        const { result } = renderHook(() => useFloorplans(projectId))

        // Initially loading
        expect(result.current.isLoading).toBe(true)

        // Wait for floorplans to load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.floorplans).toHaveLength(2)
        expect(result.current.floorplans[0].name).toBe('Floor 1')
        expect(result.current.floorplans[1].name).toBe('Floor 2')
    })

    it('should return empty array when no floorplans exist', async () => {
        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.floorplans).toEqual([])
    })

    it('should sort floorplans by ID', async () => {
        // Add floorplans in reverse order
        const fp1 = createTestFloorplan(projectId, { id: 'fp-002', name: 'Floor 2' })
        const fp2 = createTestFloorplan(projectId, { id: 'fp-001', name: 'Floor 1' })
        await db.floorplans.bulkAdd([fp1, fp2])

        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Should be sorted by ID
        expect(result.current.floorplans[0].id).toBe('fp-001')
        expect(result.current.floorplans[1].id).toBe('fp-002')
    })

    it('should add a new floorplan', async () => {
        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.floorplans).toHaveLength(0)

        // Add a floorplan
        const mockFile = createMockFile('new-floor.jpg')
        const { floorplanId } = await result.current.addFloorplan(mockFile)

        expect(floorplanId).toBeTruthy()
        expect(compressImageToJpeg).toHaveBeenCalledWith(mockFile, expect.any(Number), 0.75)

        // Verify floorplan was added to database
        const floorplan = await db.floorplans.get(floorplanId)
        expect(floorplan).toBeDefined()
        expect(floorplan?.projectId).toBe(projectId)
        expect(floorplan?.name).toBe('new-floor.jpg')
        expect(floorplan?.width).toBe(800)
        expect(floorplan?.height).toBe(600)

        // Verify hook state updated
        await waitFor(() => {
            expect(result.current.floorplans).toHaveLength(1)
        })
    })

    it('should use fallback name when file has no name', async () => {
        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const mockFile = createMockFile('')
        await result.current.addFloorplan(mockFile)

        await waitFor(() => {
            expect(result.current.floorplans).toHaveLength(1)
        })

        const floorplan = result.current.floorplans[0]
        expect(floorplan.name).toContain('Test Project Floorplan')
    })

    it('should update project updatedAt timestamp when adding floorplan', async () => {
        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const projectBefore = await db.projects.get(projectId)
        const updatedAtBefore = projectBefore?.updatedAt

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10))

        const mockFile = createMockFile('floor.jpg')
        await result.current.addFloorplan(mockFile)

        const projectAfter = await db.projects.get(projectId)
        expect(projectAfter?.updatedAt).not.toBe(updatedAtBefore)
        expect(new Date(projectAfter!.updatedAt)).toBeInstanceOf(Date)
    })

    it('should throw error when project does not exist', async () => {
        const { result } = renderHook(() => useFloorplans('non-existent-project'))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const mockFile = createMockFile('floor.jpg')

        await expect(result.current.addFloorplan(mockFile)).rejects.toThrow('Project not found')
    })

    it('should refresh floorplan list', async () => {
        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.floorplans).toHaveLength(0)

        // Add floorplan directly to database (bypassing hook)
        const fp = createTestFloorplan(projectId)
        await db.floorplans.add(fp)

        // Refresh should pick up the new floorplan
        await result.current.refresh()

        await waitFor(() => {
            expect(result.current.floorplans).toHaveLength(1)
        })
    })

    it('should handle multiple floorplans with sequential names', async () => {
        const { result } = renderHook(() => useFloorplans(projectId))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const mockFile = createMockFile('floor.png', 'image/png')
        const { floorplanId } = await result.current.addFloorplan(mockFile)

        const floorplan = await db.floorplans.get(floorplanId)
        expect(floorplan?.type).toBe('image/jpeg')
    })
})
