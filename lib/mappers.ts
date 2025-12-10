import type {
  Floorplan as UIFloorplan,
  Project as UIProject,
  Pin as UIPin,
  PinPhoto as UIPinPhoto,
  SyncStatus,
} from '@/lib/types'
import type { FloorplanRow, PinRow, ProjectRow, PhotoRow } from '@/lib/db'
import { db } from '@/lib/db'

// Compute a pin sync status from its photos
async function computePinStatus(pinId: string): Promise<SyncStatus> {
  const photos = await db.photos.where('pinId').equals(pinId).toArray()

  // Check photos first
  if (photos.some((p) => p.status === 'error')) return 'error'
  if (photos.some((p) => p.status === 'syncing')) return 'syncing'
  if (photos.some((p) => p.status === 'pending')) return 'pending'

  // Check if pin itself needs syncing (has outbox entries)
  const outboxEntries = await db.outbox
    .where('entityType')
    .equals('pin')
    .and((row) => row.entityId === pinId)
    .toArray()

  if (outboxEntries.length > 0) return 'pending'

  return 'synced'
}

function mapFloorplanRow(row: FloorplanRow, pinCount: number): UIFloorplan {
  return {
    floorplanId: row.id,
    name: row.name,
    localUri: row.localUri,
    width: row.width,
    height: row.height,
    driveFileId: row.driveFileId,
    pinCount,
  }
}

type MapToUIProjectOptions = {
  activeFloorplanId?: string | null
}

export async function mapToUIProject(
  project: ProjectRow,
  floorplans: FloorplanRow[],
  options: MapToUIProjectOptions = {},
): Promise<UIProject> {
  const fallbackFloorplan = floorplans[0] ?? null
  const activeFloorplanRow =
    floorplans.find((fp) => fp.id === options.activeFloorplanId) ?? fallbackFloorplan
  const activeFloorplanId = activeFloorplanRow?.id ?? null

  const floorplanPinCounts = new Map<string, number>()
  let activePinRows: PinRow[] = []

  for (const floorplan of floorplans) {
    const pins = await db.pins.where('floorplanId').equals(floorplan.id).toArray()
    floorplanPinCounts.set(floorplan.id, pins.length)
    if (floorplan.id === activeFloorplanId) {
      activePinRows = pins
    }
  }

  const pinRows: PinRow[] = activePinRows

  const uiPins: UIPin[] = []
  for (const pr of pinRows) {
    const photos = await db.photos.where('pinId').equals(pr.id).toArray()
    const syncStatus = await computePinStatus(pr.id)
    const pinPhotos: UIPinPhoto[] = photos.slice(0, 4).map((photo) => ({
      photoId: photo.id,
      localUri: photo.localUri,
      width: photo.width,
      height: photo.height,
      sizeBytes: photo.sizeBytes,
      status: photo.status,
      driveFileId: photo.driveFileId,
    }))
    uiPins.push({
      pinId: pr.id,
      xPct: pr.xPct,
      yPct: pr.yPct,
      title: pr.title,
      note: pr.note,
      photos: pinPhotos,
      syncStatus,
    })
  }

  const uiFloorplans: UIFloorplan[] = floorplans.map((floorplan) =>
    mapFloorplanRow(floorplan, floorplanPinCounts.get(floorplan.id) ?? 0),
  )

  const projectStatus: SyncStatus = ((): SyncStatus => {
    if (uiPins.some((p) => p.syncStatus === 'error')) return 'error'
    if (uiPins.some((p) => p.syncStatus === 'syncing')) return 'syncing'
    if (uiPins.some((p) => p.syncStatus === 'pending')) return 'pending'
    if (!project.driveFolderId) return 'pending'
    // Check if ANY floorplan needs syncing, not just the active one
    // Only consider floorplans pending if they lack a Drive ID AND have a local URI (not "ghost" records)
    if (floorplans.some((fp) => !fp.driveFileId && fp.localUri)) return 'pending'
    return 'synced'
  })()

  const lastSynced = project.syncedAt ?? project.updatedAt

  return {
    projectId: project.id,
    name: project.name,
    lastSynced,
    status: projectStatus,
    activeFloorplanId,
    floorplans: uiFloorplans,
    pins: uiPins,
    syncAnomaly: project.syncAnomaly ?? null,
  }
}

export function buildProjectJsonPayload(
  project: ProjectRow,
  activeFloorplan: FloorplanRow | null,
  allFloorplans: FloorplanRow[],
  pins: PinRow[],
  photosByPin: Map<string, PhotoRow[]>,
  syncedAt: string,
  activeFloorplanId: string | null,
) {
  return {
    project: {
      id: project.id,
      name: project.name,
      syncedAt,
      driveFolderId: project.driveFolderId,
      activeFloorplanId,
    },
    floorplan: activeFloorplan
      ? {
        id: activeFloorplan.id,
        projectId: activeFloorplan.projectId,
        name: activeFloorplan.name,
        type: activeFloorplan.type,
        width: activeFloorplan.width,
        height: activeFloorplan.height,
        driveFileId: activeFloorplan.driveFileId,
      }
      : null,
    floorplans: allFloorplans.map((fp) => ({
      id: fp.id,
      projectId: fp.projectId,
      name: fp.name,
      type: fp.type,
      width: fp.width,
      height: fp.height,
      driveFileId: fp.driveFileId,
    })),
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
