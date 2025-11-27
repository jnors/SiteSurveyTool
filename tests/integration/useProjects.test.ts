import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProjects } from '@/lib/hooks/use-projects'
import { db } from '@/lib/db'
import {
    setupTestDatabase,
    teardownTestDatabase,
    createTestProject,
    createMockFile,
    mockImageCompression,
} from './test-utils'

// Mock dependencies
vi.mock('@/lib/google', () => ({
    deleteProjectClient: vi.fn().mockResolvedValue(undefined),
    ensureProjectFolderClient: vi.fn().mockResolvedValue({
        rootFolderId: 'mock-root',
        projectFolderId: 'mock-project',
    }),
    validateProjectFolderClient: vi.fn().mockResolvedValue({
        exists: true,
        anomaly: null,
    }),
}))

// Mock mappers - implementation provided in beforeEach
vi.mock('@/lib/mappers', () => ({
    mapToUIProject: vi.fn(),
}))

vi.mock('@/lib/utils/image', () => ({
    compressImageToJpeg: vi.fn(),
}))

vi.mock('@/lib/seed', () => ({
    seedIfEmpty: vi.fn().mockResolvedValue(undefined),
}))

import { deleteProjectClient } from '@/lib/google'
import { compressImageToJpeg } from '@/lib/utils/image'
import { mapToUIProject } from '@/lib/mappers'

describe('useProjects Integration Tests', () => {
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

        // Setup mock mappers
        vi.mocked(mapToUIProject).mockImplementation(async (project) => ({
            projectId: project.id,
            name: project.name,
            updatedAt: project.updatedAt,
            floorplans: [],
            pins: [],
            lastSynced: project.updatedAt,
            status: 'synced',
            activeFloorplanId: null,
            syncAnomaly: null,
        }))
    })

    afterEach(async () => {
        await teardownTestDatabase()
    })

    it('should load all projects', async () => {
        // Add test projects
        const p1 = createTestProject({ id: 'p1', name: 'Project A' })
        const p2 = createTestProject({ id: 'p2', name: 'Project B' })
        await db.projects.bulkAdd([p1, p2])

        // Add floorplans (required for projects to be loaded)
        const fp1 = { id: 'fp1', projectId: 'p1', name: 'FP1', width: 100, height: 100, localUri: 'uri', driveFileId: 'id', type: 'image/jpeg' }
        const fp2 = { id: 'fp2', projectId: 'p2', name: 'FP2', width: 100, height: 100, localUri: 'uri', driveFileId: 'id', type: 'image/jpeg' }
        await db.floorplans.bulkAdd([fp1, fp2])

        const { result } = renderHook(() => useProjects())

        // Initially loading
        expect(result.current.isLoading).toBe(true)

        // Wait for projects to load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.projects).toHaveLength(2)
        const names = result.current.projects.map(p => p.name)
        expect(names).toContain('Project A')
        expect(names).toContain('Project B')
    })

    it('should handle empty project list', async () => {
        const { result } = renderHook(() => useProjects())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.projects).toEqual([])
    })

    it('should create a new project with initial floorplan', async () => {
        const { result } = renderHook(() => useProjects())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const mockFile = createMockFile('floorplan.jpg')

        let projectId: string = ''
        await act(async () => {
            projectId = await result.current.createProject({
                name: 'New Project',
                file: mockFile,
            })
        })

        expect(projectId).toBeTruthy()

        // Verify project in DB
        const project = await db.projects.get(projectId)
        expect(project).toBeDefined()
        expect(project?.name).toBe('New Project')

        // Verify floorplan created
        const floorplans = await db.floorplans.where('projectId').equals(projectId).toArray()
        expect(floorplans).toHaveLength(1)
        expect(floorplans[0].name).toBe('floorplan.jpg')

        // Verify list updated
        await waitFor(() => {
            const p = result.current.projects.find(p => p.projectId === projectId)
            expect(p).toBeDefined()
        })
    })

    it('should delete a project', async () => {
        const p1 = createTestProject({ id: 'p1', name: 'To Delete', driveFolderId: 'folder-1' })
        await db.projects.add(p1)

        // Add floorplan
        const fp1 = { id: 'fp1', projectId: 'p1', name: 'FP1', width: 100, height: 100, localUri: 'uri', driveFileId: 'id', type: 'image/jpeg' }
        await db.floorplans.add(fp1)

        const { result } = renderHook(() => useProjects())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.projects).toHaveLength(1)

        await act(async () => {
            await result.current.deleteProject('p1')
        })

        // Verify DB deletion
        const project = await db.projects.get('p1')
        expect(project).toBeUndefined()

        // Verify Drive deletion called
        expect(deleteProjectClient).toHaveBeenCalledWith({ driveFolderId: 'folder-1' })

        // Verify list updated
        await waitFor(() => {
            expect(result.current.projects).toHaveLength(0)
        })
    })
})
