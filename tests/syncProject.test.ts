import { Buffer } from 'node:buffer'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/lib/db'
import { syncProject } from '@/lib/sync'

vi.mock('@/lib/google', () => ({
  uploadPhotoClient: vi.fn(),
  uploadFloorplanClient: vi.fn(),
  writeProjectJsonClient: vi.fn(),
}))

const { uploadPhotoClient, uploadFloorplanClient, writeProjectJsonClient } = await import('@/lib/google')

const dataUrl = 'data:image/jpeg;base64,' + Buffer.from('test-image').toString('base64')

beforeEach(async () => {
  await db.delete()
  await db.open()
  vi.resetAllMocks()
})

describe('syncProject', () => {
  it('uploads photos, floorplan, and writes project.json', async () => {
    const now = new Date().toISOString()
    await db.projects.add({ id: 'proj-1', name: 'Project 1', createdAt: now, updatedAt: now })
    await db.floorplans.add({
      id: 'fp-1',
      projectId: 'proj-1',
      name: 'Floorplan',
      type: 'image/jpeg',
      width: 100,
      height: 100,
      localUri: dataUrl,
    })
    await db.pins.add({
      id: 'pin-1',
      floorplanId: 'fp-1',
      title: 'Pin 1',
      note: '',
      xPct: 50,
      yPct: 50,
      updatedAt: now,
    })
    await db.photos.add({
      id: 'photo-1',
      pinId: 'pin-1',
      localUri: dataUrl,
      width: 100,
      height: 100,
      sizeBytes: 1234,
      status: 'pending',
    })
    await db.outbox.add({
      id: 'outbox-1',
      kind: 'upload_photo',
      entityType: 'photo',
      entityId: 'photo-1',
      payload: {},
      retries: 0,
    })

    vi.mocked(uploadPhotoClient).mockResolvedValue({ driveFileId: 'drive-photo-1' })
    vi.mocked(uploadFloorplanClient).mockResolvedValue({ driveFileId: 'drive-floor-1' })
    vi.mocked(writeProjectJsonClient).mockResolvedValue({ driveFileId: 'json-1' })

    const summary = await syncProject('proj-1', 'drive-folder-1')

    expect(uploadPhotoClient).toHaveBeenCalledTimes(1)
    expect(uploadFloorplanClient).toHaveBeenCalledTimes(1)
    expect(writeProjectJsonClient).toHaveBeenCalledTimes(1)

    const photo = await db.photos.get('photo-1')
    expect(photo?.status).toBe('synced')
    expect(photo?.driveFileId).toBe('drive-photo-1')
    const floorplan = await db.floorplans.get('fp-1')
    expect(floorplan?.driveFileId).toBe('drive-floor-1')
    expect(summary.photoStats.success).toBe(1)
    expect(summary.errors).toHaveLength(0)
    const outboxCount = await db.outbox.count()
    expect(outboxCount).toBe(0)

    const writeCall = vi.mocked(writeProjectJsonClient).mock.calls[0]?.[0]
    expect(writeCall?.payload.project.activeFloorplanId).toBe('fp-1')
    expect(writeCall?.payload.floorplan?.id).toBe('fp-1')
  })

  it('writes project.json with only the selected floorplan', async () => {
    const now = new Date().toISOString()
    await db.projects.add({ id: 'proj-2', name: 'Project 2', createdAt: now, updatedAt: now })
    await db.floorplans.bulkAdd([
      {
        id: 'fp-a',
        projectId: 'proj-2',
        name: 'Ground',
        type: 'image/jpeg',
        width: 100,
        height: 100,
        localUri: dataUrl,
      },
      {
        id: 'fp-b',
        projectId: 'proj-2',
        name: 'Second',
        type: 'image/jpeg',
        width: 200,
        height: 200,
        localUri: dataUrl,
      },
    ])
    await db.pins.bulkAdd([
      {
        id: 'pin-a',
        floorplanId: 'fp-a',
        title: 'Pin A',
        note: '',
        xPct: 25,
        yPct: 25,
        updatedAt: now,
      },
      {
        id: 'pin-b',
        floorplanId: 'fp-b',
        title: 'Pin B',
        note: '',
        xPct: 75,
        yPct: 75,
        updatedAt: now,
      },
    ])

    vi.mocked(uploadFloorplanClient).mockResolvedValue({ driveFileId: 'drive-floor-selected' })
    vi.mocked(writeProjectJsonClient).mockResolvedValue({ driveFileId: 'json-selected' })

    await syncProject('proj-2', 'drive-folder-2', { floorplanId: 'fp-b' })

    expect(uploadFloorplanClient).toHaveBeenCalledTimes(1)
    const writeArgs = vi.mocked(writeProjectJsonClient).mock.calls[0]?.[0]
    expect(writeArgs?.payload.project.activeFloorplanId).toBe('fp-b')
    expect(writeArgs?.payload.floorplan?.id).toBe('fp-b')
    expect(writeArgs?.payload.pins).toHaveLength(1)
    expect(writeArgs?.payload.pins[0]?.id).toBe('pin-b')
  })
})
