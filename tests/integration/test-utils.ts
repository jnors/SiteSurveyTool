import { vi } from 'vitest'
import { db } from '@/lib/db'

/**
 * Test utilities for integration tests with fake-indexeddb
 */

/**
 * Reset and initialize the database for testing
 */
export async function setupTestDatabase() {
    await db.delete()
    await db.open()
}

/**
 * Clean up the database after tests
 */
export async function teardownTestDatabase() {
    await db.delete()
}

/**
 * Create a mock File object for testing
 */
export function createMockFile(
    name: string = 'test-image.jpg',
    type: string = 'image/jpeg',
    size: number = 1024
): File {
    const blob = new Blob(['mock file content'], { type })
    return new File([blob], name, { type })
}

/**
 * Create a mock data URL for testing
 */
export function createMockDataUrl(width: number = 800, height: number = 600): string {
    // Simple base64-encoded 1x1 JPEG
    return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP/2wBDAP/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AA`
}

/**
 * Create test project data
 */
export function createTestProject(overrides: Partial<{
    id: string
    name: string
    createdAt: string
    updatedAt: string
    driveFolderId?: string
    syncedAt?: string
}> = {}) {
    const now = new Date().toISOString()
    return {
        id: 'test-proj-1',
        name: 'Test Project',
        createdAt: now,
        updatedAt: now,
        ...overrides,
    }
}

/**
 * Create test floorplan data
 */
export function createTestFloorplan(projectId: string, overrides: Partial<{
    id: string
    name: string
    type: string
    width: number
    height: number
    localUri: string
    driveFileId?: string
}> = {}) {
    return {
        id: `test-fp-${Date.now()}`,
        projectId,
        name: 'Test Floorplan',
        type: 'image/jpeg',
        width: 800,
        height: 600,
        localUri: createMockDataUrl(),
        ...overrides,
    }
}

/**
 * Create test pin data
 */
export function createTestPin(floorplanId: string, overrides: Partial<{
    id: string
    title: string
    note: string
    xPct: number
    yPct: number
    updatedAt: string
}> = {}) {
    const now = new Date().toISOString()
    return {
        id: `test-pin-${Date.now()}`,
        floorplanId,
        title: 'Test Pin',
        note: '',
        xPct: 50,
        yPct: 50,
        updatedAt: now,
        ...overrides,
    }
}

/**
 * Create test photo data
 */
export function createTestPhoto(pinId: string, overrides: Partial<{
    id: string
    localUri: string
    width: number
    height: number
    sizeBytes: number
    status: 'pending' | 'synced' | 'error'
    driveFileId?: string
}> = {}) {
    return {
        id: `test-photo-${Date.now()}`,
        pinId,
        localUri: createMockDataUrl(),
        width: 800,
        height: 600,
        sizeBytes: 1024,
        status: 'pending' as const,
        ...overrides,
    }
}

/**
 * Seed database with a complete project structure
 */
export async function seedTestProject() {
    const project = createTestProject()
    await db.projects.add(project)

    const floorplan = createTestFloorplan(project.id)
    await db.floorplans.add(floorplan)

    const pin = createTestPin(floorplan.id)
    await db.pins.add(pin)

    const photo = createTestPhoto(pin.id)
    await db.photos.add(photo)

    return { project, floorplan, pin, photo }
}

/**
 * Mock image compression utility
 */
export function mockImageCompression() {
    return vi.fn().mockResolvedValue({
        dataUrl: createMockDataUrl(),
        width: 800,
        height: 600,
    })
}

/**
 * Mock Google Drive API functions
 */
export function mockGoogleDriveApis() {
    return {
        deletePhotoClient: vi.fn().mockResolvedValue(undefined),
        ensureProjectFolderClient: vi.fn().mockResolvedValue({
            rootFolderId: 'mock-root',
            projectFolderId: 'mock-project-folder',
        }),
        validateProjectFolderClient: vi.fn().mockResolvedValue({
            exists: true,
            anomaly: null,
        }),
        deleteProjectClient: vi.fn().mockResolvedValue(undefined),
    }
}
