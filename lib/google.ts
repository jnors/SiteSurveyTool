// Client-side Google Drive client helpers

export type EnsureFoldersResponse = {
  rootId: string
  projectFolderId: string
  created?: { root?: boolean; project?: boolean }
  movedOrMissing?: boolean
}

export async function ensureProjectFolderClient(params: {
  projectId: string
  projectName: string
  driveFolderId?: string
}): Promise<EnsureFoldersResponse> {
  console.log('[drive] ensureProjectFolderClient POST /api/drive/ensure', params)
  const res = await fetch('/api/drive/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ensureProjectFolder failed: ${res.status} ${text}`)
  }
  return (await res.json()) as EnsureFoldersResponse
}

type UploadPhotoParams = {
  projectFolderId: string
  photoId: string
  pinId: string
  dataUrl: string
  fileName?: string
}

export async function uploadPhotoClient(params: UploadPhotoParams): Promise<{ driveFileId: string }> {
  const res = await fetch('/api/drive/upload/photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`uploadPhoto failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { driveFileId: string }
}

type UploadFloorplanParams = {
  projectFolderId: string
  floorplanId: string
  name: string
  dataUrl: string
  fileName?: string
}

export async function uploadFloorplanClient(params: UploadFloorplanParams): Promise<{ driveFileId: string }> {
  const res = await fetch('/api/drive/upload/floorplan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`uploadFloorplan failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { driveFileId: string }
}

type WriteProjectJsonParams = {
  projectFolderId: string
  payload: unknown
}

export async function writeProjectJsonClient(params: WriteProjectJsonParams): Promise<{ driveFileId: string }> {
  const res = await fetch('/api/drive/write/project-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`writeProjectJson failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { driveFileId: string }
}
