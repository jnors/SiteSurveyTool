import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/relink/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
    driveFetch: vi.fn(),
    findFolderByName: vi.fn(),
}))

vi.mock('@/core', () => ({
    DRIVE_ROOT_NAME: 'FieldPins',
}))

import { requireServerAccessToken, driveFetch, findFolderByName } from '@/sync/drive'

describe('POST /api/drive/relink', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-id-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.code).toBe('INVALID_REQUEST')
    })

    it('should return error if required fields are missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                // Missing projectName and folderInput
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('INVALID_REQUEST')
    })

    it('should extract folder ID from URL', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'folder-123',
                name: 'Test Project__proj-123',
                parents: ['root-id'],
                mimeType: 'application/vnd.google-apps.folder',
                owners: [{ me: true }],
                trashed: false,
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'https://drive.google.com/drive/folders/folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.folderId).toBe('folder-123')
    })

    it('should accept raw folder ID', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'folder-123',
                name: 'Test Project__proj-123',
                parents: ['root-id'],
                mimeType: 'application/vnd.google-apps.folder',
                owners: [{ me: true }],
                trashed: false,
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.folderId).toBe('folder-123')
    })

    it('should return error if folder not found', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: false,
            status: 404,
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('NOT_FOUND')
    })

    it('should return error if not a folder', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'file-123',
                name: 'document.pdf',
                mimeType: 'application/pdf', // Not a folder
                parents: ['root-id'],
                owners: [{ me: true }],
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'file-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('NOT_A_FOLDER')
    })

    it('should return error if folder is trashed', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'folder-123',
                name: 'Test Project__proj-123',
                mimeType: 'application/vnd.google-apps.folder',
                trashed: true, // In trash
                parents: ['root-id'],
                owners: [{ me: true }],
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('TRASHED')
    })

    it('should return error if user is not owner', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'folder-123',
                name: 'Test Project__proj-123',
                mimeType: 'application/vnd.google-apps.folder',
                parents: ['root-id'],
                owners: [{ me: false }], // Not owner
                trashed: false,
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('NOT_OWNER')
    })

    it('should return error if folder has wrong parent', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'folder-123',
                name: 'Test Project__proj-123',
                mimeType: 'application/vnd.google-apps.folder',
                parents: ['wrong-parent-id'], // Wrong parent
                owners: [{ me: true }],
                trashed: false,
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('WRONG_PARENT')
    })

    it('should return error if folder name does not match', async () => {
        vi.mocked(findFolderByName).mockResolvedValue({ id: 'root-id' })
        vi.mocked(driveFetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'folder-123',
                name: 'Wrong Name__proj-123', // Wrong name
                mimeType: 'application/vnd.google-apps.folder',
                parents: ['root-id'],
                owners: [{ me: true }],
                trashed: false,
            }),
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/relink', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'proj-123',
                projectName: 'Test Project',
                folderInput: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.code).toBe('NAME_MISMATCH')
    })
})
