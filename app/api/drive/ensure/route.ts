import { NextResponse } from 'next/server'

import { requireServerAccessToken } from '@/sync/drive'
import { DRIVE_ROOT_NAME } from '@/core'
import { createClient } from '@/lib/supabase/server'

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

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
  anomaly?: 'moved' | 'missing'
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

  // Get Supabase client and user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const created: EnsureResult['created'] = {}

  // 1) Ensure root FieldPins under My Drive
  const ROOT_NAME = DRIVE_ROOT_NAME
  const ROOT_PARENT = 'root'

  // Try to get root folder ID from database first (for drive.file scope compatibility)
  const { data: profile } = await supabase
    .from('profiles')
    .select('drive_root_folder_id')
    .eq('id', user.id)
    .single()

  let root: { id: string; name: string; parents?: string[] } | null = null

  // If we have a stored folder ID, verify it still exists
  if (profile?.drive_root_folder_id) {
    try {
      const existing = await getFileById(token, profile.drive_root_folder_id)
      if (existing && !existing.trashed && existing.name === ROOT_NAME) {
        root = existing
      }
    } catch (error) {
      console.warn('[ensure] Stored root folder not found, will search/create:', error)
    }
  }

  // Fall back to search by name (works on first creation or if not stored)
  if (!root) {
    root = await findFolderByName(token, ROOT_NAME, ROOT_PARENT)
  }

  // Create if it doesn't exist
  if (!root) {
    const createdRoot = await createFolder(token, ROOT_NAME, ROOT_PARENT)
    root = { id: createdRoot.id, name: ROOT_NAME, parents: [ROOT_PARENT] }
    created.root = true
  }

  // Store the root folder ID in database for future use
  if (!profile?.drive_root_folder_id || profile.drive_root_folder_id !== root.id) {
    await supabase
      .from('profiles')
      .update({ drive_root_folder_id: root.id })
      .eq('id', user.id)
  }

  // 2) Ensure project folder under root
  const projectFolderName = `${body.projectName}__${body.projectId}`

  // If we were given a cached driveFolderId, verify it
  let movedOrMissing = false
  let anomaly: EnsureResult['anomaly']
  if (body.driveFolderId) {
    const existing = await getFileById(token, body.driveFolderId)
    const notFound = !existing
    const trashed = existing?.trashed ?? false
    const badParent = existing ? !((existing.parents || []).includes(root.id)) : false
    const nameMismatch = existing ? existing.name !== projectFolderName : false
    if (notFound || trashed) {
      movedOrMissing = true
      anomaly = 'missing'
      // fall through to discover by name or create below
    } else if (badParent || nameMismatch) {
      movedOrMissing = true
      anomaly = 'moved'
      // fall through to discover by name or create below
    } else {
      return NextResponse.json({
        rootId: root.id,
        projectFolderId: existing.id,
        created,
        movedOrMissing: false,
        anomaly,
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
    anomaly,
  } satisfies EnsureResult)
}

