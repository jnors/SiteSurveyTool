import { db, type FloorplanRow, type PhotoRow, type PinRow, type ProjectRow } from './db'
import { fakeProjects } from './fake-data'

// Seed the Dexie DB from fake data if empty
export async function seedIfEmpty() {
  const count = await db.projects.count()
  if (count > 0) return

  const nowIso = new Date().toISOString()

  for (const p of fakeProjects) {
    const project: ProjectRow = {
      id: p.projectId,
      name: p.name,
      createdAt: nowIso,
      updatedAt: nowIso,
      syncedAt: p.lastSynced,
    }
    await db.projects.add(project)

    for (const fp of p.floorplans) {
      const floorplan: FloorplanRow = {
        id: fp.floorplanId,
        projectId: p.projectId,
        name: fp.name,
        type: 'image/jpeg',
        width: fp.width,
        height: fp.height,
        localUri: fp.localUri,
        driveFileId: fp.driveFileId,
      }
      await db.floorplans.add(floorplan)
    }

    const activeFloorplanId = p.activeFloorplanId ?? p.floorplans[0]?.floorplanId
    if (activeFloorplanId) {
      for (const pin of p.pins) {
        const pinRow: PinRow = {
          id: pin.pinId,
          floorplanId: activeFloorplanId,
          title: pin.title,
          note: pin.note,
          xPct: pin.xPct,
          yPct: pin.yPct,
          updatedAt: nowIso,
        }
        await db.pins.add(pinRow)

        // Create photo rows. For seed, mirror pin syncStatus to each photo.
        const photoUris = pin.photos
        for (let i = 0; i < photoUris.length; i++) {
          const photo: PhotoRow = {
            id: `${pin.pinId}-ph-${i + 1}`,
            pinId: pin.pinId,
            localUri: photoUris[i]!,
            width: 0,
            height: 0,
            sizeBytes: 0,
            status: pin.syncStatus,
          }
          await db.photos.add(photo)
        }
      }
    }
  }
}
