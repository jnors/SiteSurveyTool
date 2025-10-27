import type { Project as UIProject, Pin as UIPin, SyncStatus } from '@/lib/types'
import type { ProjectRow, FloorplanRow, PinRow } from '@/lib/db'
import { db } from '@/lib/db'

// Compute a pin sync status from its photos
async function computePinStatus(pinId: string): Promise<SyncStatus> {
  const photos = await db.photos.where('pinId').equals(pinId).toArray()
  if (photos.some((p) => p.status === 'error')) return 'error'
  if (photos.some((p) => p.status === 'syncing')) return 'syncing'
  if (photos.some((p) => p.status === 'pending')) return 'pending'
  return 'synced'
}

export async function mapToUIProject(project: ProjectRow, floorplan: FloorplanRow): Promise<UIProject> {
  const pinRows = await db.pins.where('floorplanId').equals(floorplan.id).toArray()
  const uiPins: UIPin[] = []
  for (const pr of pinRows) {
    const photos = await db.photos.where('pinId').equals(pr.id).toArray()
    const syncStatus = await computePinStatus(pr.id)
    const uiPin: UIPin = {
      pinId: pr.id,
      xPct: pr.xPct,
      yPct: pr.yPct,
      title: pr.title,
      note: pr.note,
      photos: photos.map((ph) => ph.localUri).slice(0, 4),
      syncStatus,
    }
    uiPins.push(uiPin)
  }

  const projectStatus: SyncStatus = ((): SyncStatus => {
    if (uiPins.some((p) => p.syncStatus === 'error')) return 'error'
    if (uiPins.some((p) => p.syncStatus === 'syncing')) return 'syncing'
    if (uiPins.some((p) => p.syncStatus === 'pending')) return 'pending'
    if (!project.driveFolderId || !floorplan.driveFileId) return 'pending'
    return 'synced'
  })()

  const lastSynced = project.syncedAt ?? project.updatedAt

  const uiProject: UIProject = {
    projectId: project.id,
    name: project.name,
    lastSynced,
    status: projectStatus,
    floorplanUrl: floorplan.localUri,
    pins: uiPins,
  }

  return uiProject
}
