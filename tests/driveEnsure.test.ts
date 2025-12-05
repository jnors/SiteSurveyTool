import { NextResponse } from 'next/server'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { POST } from '@/app/api/drive/ensure/route'

vi.mock('@/lib/google-server', () => ({
  requireServerAccessToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

let requireServerAccessToken: any
let createClient: any

const mockFetch = vi.fn()
const mockUser = { id: 'user-123', email: 'test@example.com' }

beforeEach(async () => {
  vi.resetAllMocks()

  // grab the mocked exports at runtime (no top-level await)
  const googleMod = await import('@/lib/google-server')
  requireServerAccessToken = googleMod.requireServerAccessToken

  const supabaseMod = await import('@/lib/supabase/server')
  createClient = supabaseMod.createClient

    ; (globalThis as any).fetch = mockFetch

  // Mock Supabase client
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { drive_root_folder_id: null }, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  } as any)
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
