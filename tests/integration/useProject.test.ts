import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProject } from '@/lib/hooks/use-projects'
import { db } from '@/lib/db'
import {
    setupTestDatabase,
    teardownTestDatabase,
    createTestProject,
    createTestFloorplan,
    createTestPin,
    createTestPhoto,
    createMockFile,
    seedTestProject,
} from './test-utils'

// Mock dependencies
vi.mock('@/lib/google', () => ({
    deletePhotoClient: vi.fn().mockResolvedValue(undefined),
    ensureProjectFolderClient: vi.fn().mockResolvedValue({
        rootFolderId: 'mock-root',
        projectFolderId: 'mock-project',
    }),
    validateProjectFolderClient: vi.fn().mockResolvedValue({
        exists: true,
        anomaly: null,
    }),
    deleteProjectClient: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils/image', () => ({
    compressImageToJpeg: vi.fn().mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,compressed',
        width: 800,
        height: 600,
        sizeBytes: 1024,
    }),
}))

vi.mock('@/lib/sync', () => ({
    syncProject: vi.fn().mockResolvedValue({
        photoStats: { success: 1, failed: 0 },
        errors: [],
    }),
}))

vi.mock('@/lib/seed', () => ({
    seedIfEmpty: vi.fn().mockResolvedValue(undefined),
}))

import { deletePhotoClient } from '@/lib/google'
import { compressImageToJpeg } from '@/lib/utils/image'

describe('useProject Integration Tests', () => {
    const projectId = 'test-proj-1' // Matches createTestProject default

    beforeEach(async () => {
        await setupTestDatabase()
        vi.clearAllMocks()
    })

    afterEach(async () => {
        await teardownTestDatabase()
    })

    describe('Project Loading', () => {
        it('should load project with all related data', async () => {
            const { project, floorplan, pin, photo } = await seedTestProject()

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.project).toBeDefined()
            expect(result.current.project?.projectId).toBe(projectId)
            expect(result.current.project?.floorplans).toHaveLength(1)
            expect(result.current.project?.pins).toHaveLength(1)
        })

        it('should return loading state initially', () => {
            const { result } = renderHook(() => useProject(projectId, null))

            expect(result.current.isLoading).toBe(true)
            expect(result.current.project).toBeNull()
        })

        it('should handle missing project gracefully', async () => {
            const { result } = renderHook(() => useProject('non-existent', null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.project).toBeNull()
        })
    })

    describe('Pin Management', () => {
        it('should add a pin to a floorplan', async () => {
            const { project, floorplan } = await seedTestProject()

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const initialPinCount = result.current.project?.pins.length || 0
            const newPinId = 'new-pin-1'

            // Add a new pin
            await act(async () => {
                await result.current.addPin({
                    pinId: newPinId,
                    xPct: 75,
                    yPct: 25,
                    title: 'New Pin',
                    note: '',
                    photos: [],
                    syncStatus: 'pending'
                })
            })

            // Verify pin was added
            await waitFor(() => {
                expect(result.current.project?.pins.length).toBe(initialPinCount + 1)
            })

            const newPin = result.current.project?.pins.find((p) => p.xPct === 75 && p.yPct === 25)
            expect(newPin).toBeDefined()
            expect(newPin?.pinId).toBe(newPinId)
        })

        it('should delete a pin and its photos', async () => {
            const { pin, photo } = await seedTestProject()

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const initialPinCount = result.current.project?.pins.length || 0
            expect(initialPinCount).toBeGreaterThan(0)

            // Delete pin
            await act(async () => {
                await result.current.deletePin(pin.id)
            })

            // Verify pin was removed from UI
            await waitFor(() => {
                expect(result.current.project?.pins.length).toBe(initialPinCount - 1)
            })

            // Verify database
            const dbPin = await db.pins.get(pin.id)
            expect(dbPin).toBeUndefined()

            // Verify cascade deletion of photos
            const dbPhoto = await db.photos.get(photo.id)
            expect(dbPhoto).toBeUndefined()
        })
    })

    describe('Photo Management', () => {
        it('should add photo to a pin', async () => {
            const { pin } = await seedTestProject()

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Add photo
            const mockFile = createMockFile('new-photo.jpg')
            await act(async () => {
                await result.current.addPhotos(pin.id, [mockFile])
            })

            // Verify photo in database
            const photos = await db.photos.where('pinId').equals(pin.id).toArray()
            expect(photos.length).toBeGreaterThan(1) // Original + new

            // Verify compression was called
            expect(compressImageToJpeg).toHaveBeenCalled()
        })

        it('should compress large photos', async () => {
            const { pin } = await seedTestProject()

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            const largeFile = createMockFile('large.jpg', 'image/jpeg', 5 * 1024 * 1024)

            await act(async () => {
                await result.current.addPhotos(pin.id, [largeFile])
            })

            expect(compressImageToJpeg).toHaveBeenCalledWith(largeFile, expect.any(Number), expect.any(Number))
        })

        it('should enforce MAX_PHOTOS_PER_PIN limit', async () => {
            const { pin } = await seedTestProject()

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Add photos up to the limit (already has 1)
            const MAX_PHOTOS = 4
            const files = []
            for (let i = 1; i < MAX_PHOTOS; i++) {
                files.push(createMockFile(`photo-${i}.jpg`))
            }

            await act(async () => {
                await result.current.addPhotos(pin.id, files)
            })

            const photos = await db.photos.where('pinId').equals(pin.id).toArray()
            expect(photos.length).toBe(MAX_PHOTOS)

            // Try to add one more - should be ignored
            const extraFile = createMockFile('over-limit.jpg')
            await act(async () => {
                await result.current.addPhotos(pin.id, [extraFile])
            })

            const photosAfter = await db.photos.where('pinId').equals(pin.id).toArray()
            expect(photosAfter.length).toBe(MAX_PHOTOS)
        })

        it('should delete photo and enqueue Drive deletion', async () => {
            const { pin } = await seedTestProject()
            // Manually add a photo with driveFileId
            const photo = createTestPhoto(pin.id, {
                id: 'unique-photo-id-123',
                driveFileId: 'drive-file-id'
            })
            await db.photos.add(photo)

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Delete photo
            await act(async () => {
                await result.current.deletePhoto(photo.id)
            })

            // Verify database deletion
            const dbPhoto = await db.photos.get(photo.id)
            expect(dbPhoto).toBeUndefined()

            // Verify outbox entry was created for Drive deletion
            const outboxEntries = await db.outbox.where('entityId').equals(photo.id).toArray()
            expect(outboxEntries.length).toBeGreaterThan(0)
        })
    })

    describe('Floorplan Deletion', () => {
        it('should delete floorplan with cascading deletion', async () => {
            const { floorplan, pin, photo } = await seedTestProject()

            // Add a second floorplan so we can delete the first
            const fp2 = createTestFloorplan(projectId, { id: 'fp-2' })
            await db.floorplans.add(fp2)

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Delete floorplan
            await act(async () => {
                await result.current.deleteFloorplan(floorplan.id)
            })

            // Verify floorplan deleted
            const dbFloorplan = await db.floorplans.get(floorplan.id)
            expect(dbFloorplan).toBeUndefined()

            // Verify cascade: pins deleted
            const dbPin = await db.pins.get(pin.id)
            expect(dbPin).toBeUndefined()

            // Verify cascade: photos deleted
            const dbPhoto = await db.photos.get(photo.id)
            expect(dbPhoto).toBeUndefined()
        })

        it('should update outbox for sync after deletion', async () => {
            const { floorplan } = await seedTestProject()

            // Add second floorplan
            const fp2 = createTestFloorplan(projectId, { id: 'fp-2' })
            await db.floorplans.add(fp2)

            const { result } = renderHook(() => useProject(projectId, null))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            await act(async () => {
                await result.current.deleteFloorplan(floorplan.id)
            })

            // Verify outbox entry created
            const outboxEntries = await db.outbox.toArray()
            expect(outboxEntries.length).toBeGreaterThan(0)
        })
    })
})
