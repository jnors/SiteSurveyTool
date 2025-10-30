import { NextResponse } from 'next/server'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { POST } from '@/app/api/drive/ensure/route'

vi.mock('@/lib/google-server', () => ({
  requireServerAccessToken: vi.fn(),
}))

let requireServerAccessToken: any

const mockFetch = vi.fn()

beforeEach(async () => {
  vi.resetAllMocks()

  // grab the mocked export at runtime (no top-level await)
  const mod = await import('@/lib/google-server')
  requireServerAccessToken = mod.requireServerAccessToken

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
    expect(data.anomaly).toBe('moved')
  })

  it('surfaces a missing anomaly when cached folder cannot be found', async () => {
    vi.mocked(requireServerAccessToken).mockResolvedValue('token')
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'root123' }] })) // root lookup
      .mockResolvedValueOnce(new Response('', { status: 404 })) // getFileById missing
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // project lookup
      .mockResolvedValueOnce(jsonResponse({ id: 'recreated' })) // create project

    const req = new Request('http://localhost/api/drive/ensure', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj-2', projectName: 'Missing Case', driveFolderId: 'stale-folder' }),
    })

    const res = (await POST(req)) as NextResponse
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.movedOrMissing).toBe(true)
    expect(data.anomaly).toBe('missing')
    expect(data.projectFolderId).toBe('recreated')
  })

  it('returns cached folder details when the Drive folder is still valid', async () => {
    vi.mocked(requireServerAccessToken).mockResolvedValue('token')
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ files: [{ id: 'root123' }] })) // root lookup
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'proj-existing',
          name: 'Valid Project__proj-3',
          parents: ['root123'],
          trashed: false,
        }),
      ) // getFileById matches

    const req = new Request('http://localhost/api/drive/ensure', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj-3',
        projectName: 'Valid Project',
        driveFolderId: 'proj-existing',
      }),
    })

    const res = (await POST(req)) as NextResponse
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toMatchObject({
      rootId: 'root123',
      projectFolderId: 'proj-existing',
      movedOrMissing: false,
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
