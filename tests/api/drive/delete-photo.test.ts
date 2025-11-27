import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/delete/photo/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
    deleteDriveFile: vi.fn(),
}))

import { requireServerAccessToken, deleteDriveFile } from '@/sync/drive'

describe('POST /api/drive/delete/photo', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/delete/photo', {
            method: 'POST',
            body: JSON.stringify({
                driveFileId: 'file-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return 400 if JSON is invalid', async () => {
        const req = new Request('http://localhost:3000/api/drive/delete/photo', {
            method: 'POST',
            body: 'invalid-json',
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('INVALID_JSON')
    })

    it('should return 400 if driveFileId is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/delete/photo', {
            method: 'POST',
            body: JSON.stringify({}),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('MISSING_FIELDS')
    })

    it('should delete photo successfully', async () => {
        vi.mocked(deleteDriveFile).mockResolvedValue(true)

        const req = new Request('http://localhost:3000/api/drive/delete/photo', {
            method: 'POST',
            body: JSON.stringify({
                driveFileId: 'file-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.deleted).toBe(true)
        expect(deleteDriveFile).toHaveBeenCalledWith(mockToken, 'file-123')
    })

    it('should handle delete errors gracefully', async () => {
        vi.mocked(deleteDriveFile).mockRejectedValue(new Error('File not found'))

        const req = new Request('http://localhost:3000/api/drive/delete/photo', {
            method: 'POST',
            body: JSON.stringify({
                driveFileId: 'file-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('File not found')
    })
})
