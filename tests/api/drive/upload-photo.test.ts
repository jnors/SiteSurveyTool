import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/upload/photo/route'

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

describe('POST /api/drive/upload/photo', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                photoId: 'photo-456',
                pinId: 'pin-789',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return 400 if JSON is invalid', async () => {
        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: 'invalid-json',
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('INVALID_JSON')
    })

    it('should return 400 if projectFolderId is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                photoId: 'photo-456',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should return 400 if photoId is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should return 400 if dataUrl is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'folder-123',
                photoId: 'photo-456',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should upload new photo successfully', async () => {
        const mockBuffer = Buffer.from('mock-image-data')
        vi.mocked(parseDataUrl).mockReturnValue({
            buffer: mockBuffer,
            mimeType: 'image/jpeg',
        })
        vi.mocked(ensureChildFolder).mockResolvedValue('photos-folder-id')
        vi.mocked(extensionFromMime).mockReturnValue('jpg')
        vi.mocked(findFileInFolder).mockResolvedValue(null)
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'drive-file-123' })

        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                photoId: 'photo-456',
                pinId: 'pin-789',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.driveFileId).toBe('drive-file-123')

        expect(ensureChildFolder).toHaveBeenCalledWith(mockToken, 'project-folder-id', 'photos')
        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, {
            name: 'photo-456.jpg',
            parentId: 'photos-folder-id',
            mimeType: 'image/jpeg',
            data: mockBuffer,
            fileId: undefined,
        })
    })

    it('should update existing photo when file exists', async () => {
        const mockBuffer = Buffer.from('mock-image-data')
        vi.mocked(parseDataUrl).mockReturnValue({
            buffer: mockBuffer,
            mimeType: 'image/jpeg',
        })
        vi.mocked(ensureChildFolder).mockResolvedValue('photos-folder-id')
        vi.mocked(extensionFromMime).mockReturnValue('jpg')
        vi.mocked(findFileInFolder).mockResolvedValue({ id: 'existing-file-id' })
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'existing-file-id' })

        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                photoId: 'photo-456',
                pinId: 'pin-789',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.driveFileId).toBe('existing-file-id')

        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, {
            name: 'photo-456.jpg',
            parentId: 'photos-folder-id',
            mimeType: 'image/jpeg',
            data: mockBuffer,
            fileId: 'existing-file-id',
        })
    })

    it('should use custom fileName when provided', async () => {
        const mockBuffer = Buffer.from('mock-image-data')
        vi.mocked(parseDataUrl).mockReturnValue({
            buffer: mockBuffer,
            mimeType: 'image/jpeg',
        })
        vi.mocked(ensureChildFolder).mockResolvedValue('photos-folder-id')
        vi.mocked(extensionFromMime).mockReturnValue('jpg')
        vi.mocked(findFileInFolder).mockResolvedValue(null)
        vi.mocked(uploadFileMultipart).mockResolvedValue({ id: 'drive-file-123' })

        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                photoId: 'photo-456',
                pinId: 'pin-789',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
                fileName: 'custom-name.jpg',
            }),
        })

        await POST(req)

        expect(uploadFileMultipart).toHaveBeenCalledWith(mockToken, expect.objectContaining({
            name: 'custom-name.jpg',
        }))
    })

    it('should handle upload errors gracefully', async () => {
        vi.mocked(parseDataUrl).mockImplementation(() => {
            throw new Error('Invalid data URL')
        })

        const req = new Request('http://localhost:3000/api/drive/upload/photo', {
            method: 'POST',
            body: JSON.stringify({
                projectFolderId: 'project-folder-id',
                photoId: 'photo-456',
                pinId: 'pin-789',
                dataUrl: 'invalid-data',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('Invalid data URL')
    })
})
