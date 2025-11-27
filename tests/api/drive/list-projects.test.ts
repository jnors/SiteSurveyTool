import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/drive/list-projects/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
}))

vi.mock('@/core', () => ({
    DRIVE_ROOT_NAME: 'FieldPins',
}))

import { requireServerAccessToken } from '@/sync/drive'

describe('GET /api/drive/list-projects', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const response = await GET()

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return empty array if root folder does not exist', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: [] }),
        } as Response)

        const response = await GET()

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.projects).toEqual([])
    })

    it('should list projects successfully', async () => {
        vi.mocked(global.fetch)
            // Find root folder
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins' }],
                }),
            } as Response)
            // List folders in root
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [
                        { id: 'folder-1', name: 'Project Alpha__proj-123' },
                        { id: 'folder-2', name: 'Project Beta__proj-456' },
                    ],
                }),
            } as Response)

        const response = await GET()

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.projects).toHaveLength(2)
        expect(data.projects[0]).toEqual({
            folderId: 'folder-1',
            folderName: 'Project Alpha__proj-123',
            projectId: 'proj-123',
            projectName: 'Project Alpha',
        })
        expect(data.projects[1]).toEqual({
            folderId: 'folder-2',
            folderName: 'Project Beta__proj-456',
            projectId: 'proj-456',
            projectName: 'Project Beta',
        })
    })

    it('should skip malformed folder names', async () => {
        vi.mocked(global.fetch)
            // Find root folder
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins' }],
                }),
            } as Response)
            // List folders - includes malformed name
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [
                        { id: 'folder-1', name: 'Project Alpha__proj-123' },
                        { id: 'folder-2', name: 'InvalidFolderName' }, // No ID suffix
                        { id: 'folder-3', name: 'Project Gamma__proj-789' },
                    ],
                }),
            } as Response)

        const response = await GET()

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.projects).toHaveLength(2)
        expect(data.projects[0].projectId).toBe('proj-123')
        expect(data.projects[1].projectId).toBe('proj-789')
    })

    it('should handle project names with double underscores', async () => {
        vi.mocked(global.fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins' }],
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [
                        { id: 'folder-1', name: 'Project__With__Underscores__proj-999' },
                    ],
                }),
            } as Response)

        const response = await GET()

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.projects).toHaveLength(1)
        expect(data.projects[0]).toEqual({
            folderId: 'folder-1',
            folderName: 'Project__With__Underscores__proj-999',
            projectId: 'proj-999',
            projectName: 'Project__With__Underscores',
        })
    })

    it('should return empty array if no project folders exist', async () => {
        vi.mocked(global.fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: [{ id: 'root-id', name: 'FieldPins' }],
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }),
            } as Response)

        const response = await GET()

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.projects).toEqual([])
    })

    it('should handle Drive API errors gracefully', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
        } as Response)

        const response = await GET()

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('Failed to list projects from Drive')
    })
})
