import { NextResponse } from 'next/server'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { POST } from '@/app/api/drive/ensure/route'

vi.mock('@/lib/google-server', () => ({
  requireServerAccessToken: vi.fn(),
}))

const { requireServerAccessToken } = await import('@/lib/google-server')

const mockFetch = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  ;(globalThis as any).fetch = mockFetch
})

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('POST /api/drive/ensure', () => {
  it('creates root and project folders when missing', async () => {
    vi.mocked(requireServerAccessToken).mockResolvedValue('token')
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // root lookup
      .mockResolvedValueOnce(jsonResponse({ id: 'root123' })) // root create
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // project lookup
      .mockResolvedValueOnce(jsonResponse({ id: 'proj123' })) // project create

    const req = new Request('http://localhost/api/drive/ensure', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj-1', projectName: 'Test Project' }),
    })

    const res = (await POST(req)) as NextResponse
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toMatchObject({
      rootId: 'root123',
      projectFolderId: 'proj123',
      movedOrMissing: false,
    })
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('flags moved or renamed folders and recreates project folder', async () => {
    vi.mocked(requireServerAccessToken).mockResolvedValue('token')
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'root123' }] })) // root lookup
      .mockResolvedValueOnce(jsonResponse({ id: 'old-folder', name: 'Other__proj-1', parents: ['root123'] })) // getFileById mismatch
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // project lookup
      .mockResolvedValueOnce(jsonResponse({ id: 'newProj' })) // create project

    const req = new Request('http://localhost/api/drive/ensure', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj-1', projectName: 'Test Project', driveFolderId: 'old-folder' }),
    })

    const res = (await POST(req)) as NextResponse
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.movedOrMissing).toBe(true)
    expect(data.projectFolderId).toBe('newProj')
  })
})
