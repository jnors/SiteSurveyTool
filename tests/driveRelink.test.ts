import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/drive/relink/route'

vi.mock('@/lib/google-server', () => ({
  requireServerAccessToken: vi.fn(),
  findFolderByName: vi.fn(),
  driveFetch: vi.fn(),
}))

let requireServerAccessToken: any
let findFolderByName: any
let driveFetch: any

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/drive/relink', () => {
  beforeEach(async() => {
    vi.resetAllMocks()

    const mod = await import('@/lib/google-server')
    requireServerAccessToken = mod.requireServerAccessToken
    findFolderByName = mod.findFolderByName
    driveFetch = mod.driveFetch
  })

  it('validates folder and returns folderId when checks pass', async () => {
    vi.mocked(requireServerAccessToken).mockResolvedValue('token')
    vi.mocked(findFolderByName).mockResolvedValue({ id: 'root123' })
    vi.mocked(driveFetch).mockResolvedValueOnce(
      jsonResponse({
        id: 'folder123',
        name: 'Test Project__proj-1',
        parents: ['root123'],
        trashed: false,
        mimeType: 'application/vnd.google-apps.folder',
        owners: [{ me: true }],
      }),
    )

    const req = new Request('http://localhost/api/drive/relink', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj-1', projectName: 'Test Project', folderInput: 'folder123' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ folderId: 'folder123' })
  })

  it('rejects folders outside FieldPins root', async () => {
    vi.mocked(requireServerAccessToken).mockResolvedValue('token')
    vi.mocked(findFolderByName).mockResolvedValue({ id: 'root123' })
    vi.mocked(driveFetch).mockResolvedValueOnce(
      jsonResponse({
        id: 'folder123',
        name: 'Test Project__proj-1',
        parents: ['other-root'],
        trashed: false,
        mimeType: 'application/vnd.google-apps.folder',
        owners: [{ me: true }],
      }),
    )

    const req = new Request('http://localhost/api/drive/relink', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj-1', projectName: 'Test Project', folderInput: 'folder123' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('WRONG_PARENT')
  })
})
