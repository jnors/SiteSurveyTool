import { db, type FloorplanRow, type PhotoRow, type PinRow, type ProjectRow } from './db'
import { fakeProjects, sampleProject } from './fake-data'

// Seed the Dexie DB from fake data if empty
type SeedMode = 'none' | 'sample' | 'full'

function getSeedMode(): SeedMode {
  const raw = (process.env.NEXT_PUBLIC_SEED_MODE || '').toLowerCase().trim()
  if (raw === 'sample') return 'sample'
  if (raw === 'full') return 'full'
  return 'none'
}

export async function seedIfEmpty() {
  const count = await db.projects.count()
  if (count > 0) return

  const mode = getSeedMode()
  if (mode === 'none') return

  const source = mode === 'sample' ? [sampleProject] : fakeProjects
  const nowIso = new Date().toISOString()

  for (const p of source) {
    const project: ProjectRow = {
      id: p.projectId,
      name: p.name,
      createdAt: nowIso,
      updatedAt: nowIso,
      syncedAt: p.lastSynced,
      syncAnomaly: p.syncAnomaly ?? null,
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
        const photoEntries = pin.photos
        for (let i = 0; i < photoEntries.length; i++) {
          const photoEntry = photoEntries[i]!
          const photo: PhotoRow = {
            id: photoEntry.photoId,
            pinId: pin.pinId,
            localUri: photoEntry.localUri,
            width: photoEntry.width,
            height: photoEntry.height,
            sizeBytes: photoEntry.sizeBytes,
            driveFileId: photoEntry.driveFileId,
            status: photoEntry.status ?? pin.syncStatus,
          }
          await db.photos.add(photo)
        }
      }
    }
  }
}
