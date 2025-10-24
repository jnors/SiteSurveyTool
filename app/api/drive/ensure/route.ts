import { NextResponse } from 'next/server'

import { requireServerAccessToken } from '@/lib/google-server'

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

type EnsureBody = {
  projectId: string
  projectName: string
  driveFolderId?: string
}

type EnsureResult = {
  rootId: string
  projectFolderId: string
  created: { root?: boolean; project?: boolean }
  movedOrMissing?: boolean
}

async function driveFetch(token: string, url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  return res
}

async function findFolderByName(token: string, name: string, parentId: string) {
  const q = new URLSearchParams({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
    fields: 'files(id, name, parents)',
    pageSize: '10',
    spaces: 'drive',
  })
  const res = await driveFetch(token, `${DRIVE_BASE}/files?${q.toString()}`)
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`)
  const data = await res.json()
  return (data.files as Array<{ id: string; name: string; parents?: string[] }>)[0] || null
}

async function getFileById(token: string, id: string) {
  const res = await driveFetch(token, `${DRIVE_BASE}/files/${id}?fields=id,name,parents,trashed`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Drive get failed: ${res.status}`)
  return (await res.json()) as { id: string; name: string; parents?: string[]; trashed?: boolean }
}

async function createFolder(token: string, name: string, parentId: string) {
  const res = await driveFetch(token, `${DRIVE_BASE}/files`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  if (!res.ok) throw new Error(`Drive create folder failed: ${res.status}`)
  const data = await res.json()
  return data as { id: string }
}

export async function POST(req: Request) {
  let token: string
  try {
    token = await requireServerAccessToken()
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const body = (await req.json()) as EnsureBody
  if (!body?.projectId || !body?.projectName) {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
  }

  const created: EnsureResult['created'] = {}

  // 1) Ensure root SST under My Drive
  const ROOT_NAME = 'SST'
  const ROOT_PARENT = 'root'
  let root = await findFolderByName(token, ROOT_NAME, ROOT_PARENT)
  if (!root) {
    const createdRoot = await createFolder(token, ROOT_NAME, ROOT_PARENT)
    root = { id: createdRoot.id, name: ROOT_NAME, parents: [ROOT_PARENT] }
    created.root = true
  }

  // 2) Ensure project folder under root
  const projectFolderName = `${body.projectName}__${body.projectId}`

  // If we were given a cached driveFolderId, verify it
  let movedOrMissing = false
  if (body.driveFolderId) {
    const existing = await getFileById(token, body.driveFolderId)
    const badParent = existing ? !((existing.parents || []).includes(root.id)) : false
    const nameMismatch = existing ? existing.name !== projectFolderName : false
    if (!existing || existing.trashed || badParent || nameMismatch) {
      movedOrMissing = true
      // fall through to discover by name or create below
    } else {
      return NextResponse.json({
        rootId: root.id,
        projectFolderId: existing.id,
        created,
        movedOrMissing: false,
      } satisfies EnsureResult)
    }
  }

  let projectFolder = await findFolderByName(token, projectFolderName, root.id)
  if (!projectFolder) {
    const createdProj = await createFolder(token, projectFolderName, root.id)
    projectFolder = { id: createdProj.id, name: projectFolderName, parents: [root.id] }
    created.project = true
  }

  return NextResponse.json({
    rootId: root.id,
    projectFolderId: projectFolder.id,
    created,
    movedOrMissing,
  } satisfies EnsureResult)
}
