import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/drive/download/file/route'

// Mock dependencies
vi.mock('@/sync/drive', () => ({
    requireServerAccessToken: vi.fn(),
}))

import { requireServerAccessToken } from '@/sync/drive'

describe('GET /api/drive/download/file', () => {
    const mockToken = 'mock-token-123'

    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
        vi.mocked(requireServerAccessToken).mockResolvedValue(mockToken)
    })

    it('should return 401 if not authenticated', async () => {
        vi.mocked(requireServerAccessToken).mockRejectedValue(new Error('Not authenticated'))

        const req = new Request('http://localhost:3000/api/drive/download/file?fileId=file-123')

        const response = await GET(req)

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('UNAUTHENTICATED')
    })

    it('should return 400 if fileId is missing', async () => {
        const req = new Request('http://localhost:3000/api/drive/download/file')

        const response = await GET(req)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Missing fileId parameter')
    })

    it('should download file and return as base64 data URL', async () => {
        const mockFileContent = 'mock file content'
        const mockBuffer = Buffer.from(mockFileContent)

        vi.mocked(global.fetch)
            // Download file content
            .mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => mockBuffer,
            } as Response)
            // Get file metadata
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ mimeType: 'image/jpeg' }),
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/download/file?fileId=file-123')

        const response = await GET(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.dataUrl).toBe(`data:image/jpeg;base64,${mockBuffer.toString('base64')}`)
    })

    it('should use default MIME type if not specified', async () => {
        const mockFileContent = 'mock file content'
        const mockBuffer = Buffer.from(mockFileContent)

        vi.mocked(global.fetch)
            .mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => mockBuffer,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({}), // No mimeType
            } as Response)

        const req = new Request('http://localhost:3000/api/drive/download/file?fileId=file-123')

        const response = await GET(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.dataUrl).toBe(`data:application/octet-stream;base64,${mockBuffer.toString('base64')}`)
    })

    it('should handle download errors gracefully', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 404,
        } as Response)

        const req = new Request('http://localhost:3000/api/drive/download/file?fileId=file-123')

        const response = await GET(req)

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toBe('Failed to download file')
    })
})
