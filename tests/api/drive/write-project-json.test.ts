import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/write/project-json/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
    findFileInFolder: vi.fn(),
    uploadFileMultipart: vi.fn(),
}))

import {
    requireServerAccessToken,
    findFileInFolder,
    uploadFileMultipart,
} from '@/sync/drive'

describe('POST /api/drive/write/project-json', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                payload: { name: 'Test Project' },
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return 400 if JSON is invalid', async () => {
        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: 'invalid-json',
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('INVALID_JSON')
    })

    it('should return 400 if projectFolderId is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                payload: { name: 'Test Project' },
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should return 400 if payload is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should create new project.json successfully', async () => {
        vi.mocked(findFileInFolder).mockResolvedValue(null)
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'file-123' })

        const payload = {
            name: 'Test Project',
            floorplans: [],
            pins: [],
        }

        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                payload,
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.driveFileId).toBe('file-123')

        expect(findFileInFolder).toHaveBeenCalledWith(mockToken, 'folder-123', 'project.json')
        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, {
            name: 'project.json',
            parentId: 'folder-123',
            mimeType: 'application/json',
            data: expect.any(Buffer),
            fileId: undefined,
        })
    })

    it('should update existing project.json', async () => {
        vi.mocked(findFileInFolder).mockResolvedValue({ id: 'existing-file-123', name: 'project.json' })
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'existing-file-123' })

        const payload = {
            name: 'Updated Project',
            floorplans: [{ id: 'fp-1', name: 'Floor 1' }],
        }

        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                payload,
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.driveFileId).toBe('existing-file-123')

        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, expect.objectContaining({
            fileId: 'existing-file-123',
        }))
    })

    it('should properly format JSON with indentation', async () => {
        vi.mocked(findFileInFolder).mockResolvedValue(null)
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'file-123' })

        const payload = { name: 'Test', nested: { key: 'value' } }

        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                payload,
            }),
        })

        await POST(req)

        const uploadCall = vi.mocked(uploadFileMultipart).mock.calls[0][1]
        const jsonString = uploadCall.data.toString('utf-8')

        // Verify it's pretty-printed with 2-space indentation
        expect(jsonString).toContain('\n')
        expect(jsonString).toContain('  ')
        expect(JSON.parse(jsonString)).toEqual(payload)
    })

    it('should handle upload errors gracefully', async () => {
        vi.mocked(findFileInFolder).mockRejectedValue(new Error('API error'))

        const req = new Request('http://localhost:3000/api/drive/write/project-json', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                payload: { name: 'Test' },
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('API error')
    })
})
