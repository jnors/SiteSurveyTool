import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/drive/delete/project/route'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('@/lib/google-server', () => ({
    getDriveClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getDriveClient } from '@/lib/google-server'

describe('POST /api/drive/delete/project', () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(),
        },
    }

    const mockDrive = {
        files: {
            delete: vi.fn(),
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
        vi.mocked(getDriveClient).mockResolvedValue(mockDrive as any)
    })

    it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        })

        const req = new Request('http://localhost:3000/api/drive/delete/project', {
            method: 'POST',
            body: JSON.stringify({
                driveFolderId: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(401)
        expect(await response.text()).toBe('Unauthorized')
    })

    it('should return 400 if driveFolderId is missing', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        const req = new Request('http://localhost:3000/api/drive/delete/project', {
            method: 'POST',
            body: JSON.stringify({}),
        })

        const response = await POST(req)

        expect(response.status).toBe(400)
        expect(await response.text()).toBe('Drive Folder ID is required')
    })

    it('should delete project folder successfully', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        mockDrive.files.delete.mockResolvedValue({})

        const req = new Request('http://localhost:3000/api/drive/delete/project', {
            method: 'POST',
            body: JSON.stringify({
                driveFolderId: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.deleted).toBe(true)
        expect(mockDrive.files.delete).toHaveBeenCalledWith({
            fileId: 'folder-123',
        })
    })

    it('should return success if folder is already deleted (404)', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        const error404 = new Error('Not Found')
            ; (error404 as any).code = 404
        mockDrive.files.delete.mockRejectedValue(error404)

        const req = new Request('http://localhost:3000/api/drive/delete/project', {
            method: 'POST',
            body: JSON.stringify({
                driveFolderId: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.deleted).toBe(true)
    })

    it('should handle Drive API errors', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            },
            error: null,
        })

        mockDrive.files.delete.mockRejectedValue(new Error('Permission denied'))

        const req = new Request('http://localhost:3000/api/drive/delete/project', {
            method: 'POST',
            body: JSON.stringify({
                driveFolderId: 'folder-123',
            }),
        })

        const response = await POST(req)

        expect(response.status).toBe(500)
        expect(await response.text()).toBe('Permission denied')
    })
})
