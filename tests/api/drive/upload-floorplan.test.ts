import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/upload/floorplan/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
    parseDataUrl: vi.fn(),
    ensureChildFolder: vi.fn(),
    extensionFromMime: vi.fn(),
    findFileInFolder: vi.fn(),
    uploadFileMultipart: vi.fn(),
}))

import {
    requireServerAccessToken,
    parseDataUrl,
    ensureChildFolder,
    extensionFromMime,
    findFileInFolder,
    uploadFileMultipart,
} from '@/sync/drive'

describe('POST /api/drive/upload/floorplan', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/upload/floorplan', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                floorplanId: 'fp-456',
                name: 'Floor 1',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return 400 if JSON is invalid', async () => {
        const req = new Request('http://localhost:3000/api/drive/upload/floorplan', {
            method: 'POST',
            body: 'invalid-json',
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('INVALID_JSON')
    })

    it('should return 400 if required fields are missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/upload/floorplan', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                // Missing floorplanId and dataUrl
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should upload new floorplan successfully', async () => {
        const mockBuffer = Buffer.from('mock-floorplan-data')
        vi.mocked(parseDataUrl).mockReturnValue({
            buffer: mockBuffer,
            mimeType: 'image/png',
        })
        vi.mocked(ensureChildFolder).mockResolvedValue('floorplans-folder-id')
        vi.mocked(extensionFromMime).mockReturnValue('png')
        vi.mocked(findFileInFolder).mockResolvedValue(null)
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'drive-file-123' })

        const req = new Request('http://localhost:3000/api/drive/upload/floorplan', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                floorplanId: 'fp-456',
                name: 'Floor 1',
                dataUrl: 'data:image/png;base64,iVBORw0KG...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.driveFileId).toBe('drive-file-123')

        expect(ensureChildFolder).toHaveBeenCalledWith(mockToken, 'project-folder-id', 'floorplans')
        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, {
            name: 'fp-456.png',
            parentId: 'floorplans-folder-id',
            mimeType: 'image/png',
            data: mockBuffer,
            fileId: undefined,
        })
    })

    it('should update existing floorplan', async () => {
        const mockBuffer = Buffer.from('mock-floorplan-data')
        vi.mocked(parseDataUrl).mockReturnValue({
            buffer: mockBuffer,
            mimeType: 'image/png',
        })
        vi.mocked(ensureChildFolder).mockResolvedValue('floorplans-folder-id')
        vi.mocked(extensionFromMime).mockReturnValue('png')
        vi.mocked(findFileInFolder).mockResolvedValue({ id: 'existing-file-id', name: 'fp-456.png' })
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'existing-file-id' })

        const req = new Request('http://localhost:3000/api/drive/upload/floorplan', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                floorplanId: 'fp-456',
                name: 'Floor 1',
                dataUrl: 'data:image/png;base64,iVBORw0KG...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, expect.objectContaining({
            fileId: 'existing-file-id',
        }))
    })

    it('should handle upload errors gracefully', async () => {
        vi.mocked(parseDataUrl).mockImplementation(() => {
            throw new Error('Invalid data URL')
        })

        const req = new Request('http://localhost:3000/api/drive/upload/floorplan', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                floorplanId: 'fp-456',
                name: 'Floor 1',
                dataUrl: 'invalid-data',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('Invalid data URL')
    })
})
