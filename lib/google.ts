// Client-side Google Drive client helpers

import { logger } from '@/lib/logger'

export type EnsureFoldersResponse = {
  rootId: string
  projectFolderId: string
  created?: { root?: boolean; project?: boolean }
  movedOrMissing?: boolean
  anomaly?: 'moved' | 'missing'
}

export type ValidateFolderResponse = {
  folderId: string
}

export async function ensureProjectFolderClient(params: {
  projectId: string
  projectName: string
  driveFolderId?: string
}): Promise<EnsureFoldersResponse> {
  logger.drive('ensureProjectFolderClient', params)
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

export async function validateProjectFolderClient(params: {
  projectId: string
  projectName: string
  folderInput: string
}): Promise<ValidateFolderResponse> {
  const res = await fetch('/api/drive/relink', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Unable to validate Drive folder.'
    const error = new Error(message)
    if (data?.code) {
      ; (error as any).code = data.code
    }
    throw error
  }

  return data as ValidateFolderResponse
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

export async function deletePhotoClient(params: { driveFileId: string }): Promise<{ deleted: boolean }> {
  const res = await fetch('/api/drive/delete/photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`deletePhoto failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { deleted: boolean }
}

export async function deleteProjectClient(params: { driveFolderId: string }): Promise<{ deleted: boolean }> {
  const res = await fetch('/api/drive/delete/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`deleteProject failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { deleted: boolean }
}

// ===== Restore/Download Functions =====

export type DriveProjectInfo = {
  folderId: string
  folderName: string
  projectId: string
  projectName: string
}

export async function listProjectsClient(): Promise<{ projects: DriveProjectInfo[] }> {
  const res = await fetch('/api/drive/list-projects')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`listProjects failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { projects: DriveProjectInfo[] }
}

export async function downloadProjectJsonClient(params: {
  folderId: string
}): Promise<any> {
  const res = await fetch(`/api/drive/download/project-json?folderId=${params.folderId}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`downloadProjectJson failed: ${res.status} ${text}`)
  }
  return await res.json()
}

export async function downloadFileClient(params: { fileId: string }): Promise<{ dataUrl: string }> {
  const res = await fetch(`/api/drive/download/file?fileId=${params.fileId}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`downloadFile failed: ${res.status} ${text}`)
  }
  return (await res.json()) as { dataUrl: string }
}
