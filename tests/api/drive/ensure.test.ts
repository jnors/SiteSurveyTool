import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/ensure/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
}))

vi.mock('@/core', () => ({
    DRIVE_ROOT_NAME: 'FieldPins',
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

import { requireServerAccessToken } from '@/sync/drive'
import { createClient } from '@/lib/supabase/server'

describe('POST /api/drive/ensure', () => {
    const mockToken = 'mock-token-123'
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)

        // Mock Supabase client
        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
            },
            from: vi.fn((table: string) => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { drive_root_folder_id: null }, error: null }),
                update: vi.fn().mockReturnThis(),
            })),
        } as any)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return 400 if projectId is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectName: 'Test Project',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('INVALID_REQUEST')
    })

    it('should return 400 if projectName is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('INVALID_REQUEST')
    })

    it('should create root folder when it does not exist', async () => {
        vi.mocked(global.fetch)
            // Search for root folder - not found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }),
            } as Response)
            // Create root folder
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'root-folder-id' }),
            } as Response)
            // Search for project folder - not found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }),
            } as Response)
            // Create project folder
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'project-folder-id' }),
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.rootId).toBe('root-folder-id')
        expect(data.projectFolderId).toBe('project-folder-id')
        expect(data.created.root).toBe(true)
        expect(data.created.project).toBe(true)
    })

    it('should use existing root folder when it exists', async () => {
        vi.mocked(global.fetch)
            // Search for root folder - found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'existing-root-id', name: 'FieldPins', parents: ['root'] }],
                }),
            } as Response)
            // Search for project folder - not found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }),
            } as Response)
            // Create project folder
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'project-folder-id' }),
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.rootId).toBe('existing-root-id')
        expect(data.projectFolderId).toBe('project-folder-id')
        expect(data.created.root).toBeUndefined()
        expect(data.created.project).toBe(true)
    })

    it('should detect moved folder when folder exists but has wrong parent', async () => {
        vi.mocked(global.fetch)
            // Search for root folder - found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins', parents: ['root'] }],
                }),
            } as Response)
            // Get existing folder by ID - wrong parent
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'cached-folder-id',
                    name: 'Test Project__project-123',
                    parents: ['wrong-parent-id'],
                    trashed: false,
                }),
            } as Response)
            // Search for project folder by name - found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'found-folder-id', name: 'Test Project__project-123', parents: ['root-id'] }],
                }),
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
                driveFolderId: 'cached-folder-id',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.movedOrMissing).toBe(true)
        expect(data.anomaly).toBe('moved')
        expect(data.projectFolderId).toBe('found-folder-id')
    })

    it('should detect missing folder when folder is trashed', async () => {
        vi.mocked(global.fetch)
            // Search for root folder - found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins', parents: ['root'] }],
                }),
            } as Response)
            // Get existing folder by ID - trashed
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'cached-folder-id',
                    name: 'Test Project__project-123',
                    parents: ['root-id'],
                    trashed: true,
                }),
            } as Response)
            // Search for project folder by name - not found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }),
            } as Response)
            // Create new folder
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'new-folder-id' }),
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
                driveFolderId: 'cached-folder-id',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.movedOrMissing).toBe(true)
        expect(data.anomaly).toBe('missing')
        expect(data.projectFolderId).toBe('new-folder-id')
    })

    it('should return existing folder when cached ID is valid', async () => {
        vi.mocked(global.fetch)
            // Search for root folder - found
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins', parents: ['root'] }],
                }),
            } as Response)
            // Get existing folder by ID - valid
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'cached-folder-id',
                    name: 'Test Project__project-123',
                    parents: ['root-id'],
                    trashed: false,
                }),
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
                driveFolderId: 'cached-folder-id',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.rootId).toBe('root-id')
        expect(data.projectFolderId).toBe('cached-folder-id')
        expect(data.movedOrMissing).toBe(false)
        expect(data.created).toEqual({})
    })

    it('should handle Drive API errors gracefully', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/ensure', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'project-123',
                projectName: 'Test Project',
            }),
        })

        await expect(POST(req)).rejects.toThrow()
    })
})
