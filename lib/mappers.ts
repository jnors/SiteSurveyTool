import type {
  Floorplan as UIFloorplan,
  Project as UIProject,
  Pin as UIPin,
  PinPhoto as UIPinPhoto,
  SyncStatus,
} from '@/lib/types'
import type { FloorplanRow, PinRow, ProjectRow } from '@/lib/db'
import { db } from '@/lib/db'

// Compute a pin sync status from its photos
async function computePinStatus(pinId: string): Promise<SyncStatus> {
  const photos = await db.photos.where('pinId').equals(pinId).toArray()
  if (photos.some((p) => p.status === 'error')) return 'error'
  if (photos.some((p) => p.status === 'syncing')) return 'syncing'
  if (photos.some((p) => p.status === 'pending')) return 'pending'
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
    if (floorplans.some((fp) => !fp.driveFileId)) return 'pending'
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
