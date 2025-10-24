"use client"

import { db, type FloorplanRow, type OutboxRow, type PhotoRow, type PinRow, type ProjectRow } from '@/lib/db'
import { uploadFloorplanClient, uploadPhotoClient, writeProjectJsonClient } from '@/lib/google'

type PhotoUploadStats = {
  total: number
  success: number
  failed: number
}

export type ProjectSyncSummary = {
  projectId: string
  projectName: string
  photoStats: PhotoUploadStats
  floorplanUploaded: boolean
  projectJsonWritten: boolean
  errors: string[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isFatalError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('401') || message.includes('403') || message.includes('unauth')
}

async function withBackoff<T>(operation: () => Promise<T>, options: { attempts?: number; baseDelay?: number } = {}) {
  const { attempts = 3, baseDelay = 2000 } = options
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === attempts - 1 || isFatalError(error)) {
        throw error
      }
      const jitter = Math.random() * baseDelay * 0.25
      const delay = baseDelay * Math.pow(2, attempt) + jitter
      await sleep(delay)
    }
  }
  throw lastError
}

async function ensureDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) {
    return uri
  }
  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error(`Failed to fetch asset for upload (${response.status})`)
  }
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read blob as data URL'))
    reader.readAsDataURL(blob)
  })
}

function getPhotoUploadTargets(photos: Map<string, PhotoRow>, outboxPhotoIds: string[]) {
  const targets: Set<string> = new Set(outboxPhotoIds)
  for (const [id, photo] of photos) {
    if (!photo) continue
    if (photo.status !== 'synced' || !photo.driveFileId) {
      targets.add(id)
    }
  }
  return targets
}

function buildProjectJsonPayload(
  project: ProjectRow,
  floorplan: FloorplanRow | null,
  pins: PinRow[],
  photosByPin: Map<string, PhotoRow[]>,
  syncedAt: string,
) {
  return {
    project: {
      id: project.id,
      name: project.name,
      syncedAt,
      driveFolderId: project.driveFolderId,
    },
    floorplan: floorplan
      ? {
          id: floorplan.id,
          projectId: floorplan.projectId,
          name: floorplan.name,
          type: floorplan.type,
          width: floorplan.width,
          height: floorplan.height,
          driveFileId: floorplan.driveFileId,
        }
      : null,
    pins: pins.map((pin) => ({
      id: pin.id,
      floorplanId: pin.floorplanId,
      title: pin.title,
      note: pin.note,
      xPct: pin.xPct,
      yPct: pin.yPct,
      updatedAt: pin.updatedAt,
      photos: (photosByPin.get(pin.id) || []).map((photo) => ({
        id: photo.id,
        pinId: photo.pinId,
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes,
        driveFileId: photo.driveFileId,
        status: photo.status,
      })),
    })),
  }
}

export async function syncProject(projectId: string, projectFolderId: string): Promise<ProjectSyncSummary> {
  const project = (await db.projects.get(projectId)) as ProjectRow | undefined
  if (!project) {
    throw new Error(`Project ${projectId} not found`)
  }
  if (!projectFolderId) {
    throw new Error('Missing Drive project folder id')
  }

  const floorplan = (await db.floorplans.where('projectId').equals(projectId).first()) as FloorplanRow | undefined
  const pins = floorplan
    ? await db.pins.where('floorplanId').equals(floorplan.id).toArray()
    : []

  const photoMap = new Map<string, PhotoRow>()
  const photosByPin = new Map<string, PhotoRow[]>()

  for (const pin of pins) {
    const photos = await db.photos.where('pinId').equals(pin.id).toArray()
    photosByPin.set(pin.id, photos)
    for (const photo of photos) {
      photoMap.set(photo.id, photo)
    }
  }

  const outboxPhotoRows: OutboxRow[] = await db.outbox
    .where('entityType')
    .equals('photo')
    .toArray()

  const projectPhotoIds = outboxPhotoRows
    .filter((row) => photoMap.has(row.entityId))
    .map((row) => row.entityId)

  console.log('[sync] project state', projectId, 'photos', photoMap.size, 'outbox', outboxPhotoRows.length)
  const photoTargets = getPhotoUploadTargets(photoMap, projectPhotoIds)
  console.log('[sync] photo targets', projectId, Array.from(photoTargets))
  const photoStats: PhotoUploadStats = {
    total: photoTargets.size,
    success: 0,
    failed: 0,
  }

  const errors: string[] = []
  const nowIso = new Date().toISOString()

  for (const photoId of photoTargets) {
    const photo = photoMap.get(photoId)
    if (!photo) continue

    await db.photos.update(photo.id, { status: 'syncing' })
    try {
      const dataUrl = await ensureDataUrl(photo.localUri)
      console.log('[sync] uploading photo', projectId, photo.id)
      const res = await withBackoff(() =>
        uploadPhotoClient({
          projectFolderId,
          photoId: photo.id,
          pinId: photo.pinId,
          dataUrl,
        }),
      )
      await db.photos.update(photo.id, { status: 'synced', driveFileId: res.driveFileId })
      await db.outbox.where('entityType').equals('photo').and((row) => row.entityId === photo.id).delete()
      photoStats.success += 1
      console.log('[sync] uploaded photo', projectId, photo.id)
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Photo upload failed'
      errors.push(message)
      photoStats.failed += 1
      await db.photos.update(photo.id, { status: 'error' })
      console.warn('[sync] photo upload failed', projectId, photo.id, error)
      const now = new Date().toISOString()
      await db.outbox
        .where('entityType')
        .equals('photo')
        .and((row) => row.entityId === photo.id)
        .modify((row) => {
          row.retries += 1
          row.lastTriedAt = now
        })
    }
  }

  let floorplanUploaded = false
  if (floorplan) {
    try {
      if (!floorplan.driveFileId || floorplan.localUri.startsWith('data:')) {
        const dataUrl = await ensureDataUrl(floorplan.localUri)
        console.log('[sync] uploading floorplan', projectId, floorplan.id)
        const res = await withBackoff(() =>
          uploadFloorplanClient({
            projectFolderId,
            floorplanId: floorplan.id,
            name: floorplan.name,
            dataUrl,
          }),
        )
        floorplanUploaded = true
        await db.floorplans.update(floorplan.id, { driveFileId: res.driveFileId })
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Floorplan upload failed'
      errors.push(message)
    }
  }

  // Refresh photos map after potential updates
  for (const pin of pins) {
    const photos = await db.photos.where('pinId').equals(pin.id).toArray()
    photosByPin.set(pin.id, photos)
  }

  const payload = buildProjectJsonPayload(project, floorplan ?? null, pins, photosByPin, nowIso)

  let projectJsonWritten = false
  try {
    await withBackoff(() => {
      console.log('[sync] writing project.json', projectId)
      return writeProjectJsonClient({ projectFolderId, payload })
    })
    projectJsonWritten = true
    await db.projects.update(projectId, { syncedAt: nowIso })
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'project.json write failed'
    errors.push(message)
  }

  return {
    projectId,
    projectName: project.name,
    photoStats,
    floorplanUploaded,
    projectJsonWritten,
    errors,
  }
}
