import { Buffer } from 'node:buffer'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/lib/db'
import { syncProject } from '@/lib/sync'

vi.mock('@/lib/google', () => ({
  uploadPhotoClient: vi.fn(),
  uploadFloorplanClient: vi.fn(),
  writeProjectJsonClient: vi.fn(),
}))

let uploadPhotoClient: any
let uploadFloorplanClient: any
let writeProjectJsonClient: any

const dataUrl = 'data:image/jpeg;base64,' + Buffer.from('test-image').toString('base64')

beforeEach(async () => {
  await db.delete()
  await db.open()
  vi.resetAllMocks()

  const mod = await import('@/lib/google')
  uploadPhotoClient = mod.uploadPhotoClient
  uploadFloorplanClient = mod.uploadFloorplanClient
  writeProjectJsonClient = mod.writeProjectJsonClient
})

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DEMO_SYNC
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

  it('normalizes photo statuses when demo sync flag is enabled', async () => {
    process.env.NEXT_PUBLIC_DEMO_SYNC = '1'

    const now = new Date().toISOString()
    await db.projects.add({ id: 'proj-demo', name: 'Demo Project', createdAt: now, updatedAt: now })
    await db.floorplans.add({
      id: 'fp-demo',
      projectId: 'proj-demo',
      name: 'Floor',
      type: 'image/jpeg',
      width: 100,
      height: 100,
      localUri: dataUrl,
    })
    await db.pins.add({
      id: 'pin-demo',
      floorplanId: 'fp-demo',
      title: 'Pin Demo',
      note: '',
      xPct: 10,
      yPct: 20,
      updatedAt: now,
    })
    await db.photos.add({
      id: 'photo-demo',
      pinId: 'pin-demo',
      localUri: dataUrl,
      width: 100,
      height: 100,
      sizeBytes: 1111,
      status: 'pending',
    })
    await db.outbox.add({
      id: 'outbox-demo',
      kind: 'upload_photo',
      entityType: 'photo',
      entityId: 'photo-demo',
      payload: {},
      retries: 0,
    })

    vi.mocked(uploadPhotoClient).mockRejectedValue(new Error('Drive unavailable'))
    vi.mocked(uploadFloorplanClient).mockResolvedValue({ driveFileId: 'drive-floor-demo' })
    vi.mocked(writeProjectJsonClient).mockResolvedValue({ driveFileId: 'json-demo' })

    vi.useFakeTimers()
    let summary: Awaited<ReturnType<typeof syncProject>>
    try {
      const syncPromise = syncProject('proj-demo', 'drive-folder-demo')
      await vi.runAllTimersAsync()
      summary = await syncPromise
    } finally {
      vi.useRealTimers()
    }

    const normalizedPhoto = await db.photos.get('photo-demo')
    expect(normalizedPhoto?.status).toBe('synced')
    expect(summary.photoStats.success).toBe(1)
    expect(summary.photoStats.failed).toBe(0)
    expect(uploadPhotoClient).toHaveBeenCalled()

    const remainingOutbox = await db.outbox.count()
    expect(remainingOutbox).toBe(0)

    const projectRow = await db.projects.get('proj-demo')
    expect(projectRow?.syncedAt).toBeDefined()
    expect(summary.errors).toContain('Drive unavailable')
  })

  it('keeps photo errors when demo sync flag is disabled', async () => {
    delete process.env.NEXT_PUBLIC_DEMO_SYNC

    const now = new Date().toISOString()
    await db.projects.add({ id: 'proj-prod', name: 'Prod Project', createdAt: now, updatedAt: now })
    await db.floorplans.add({
      id: 'fp-prod',
      projectId: 'proj-prod',
      name: 'Floor',
      type: 'image/jpeg',
      width: 100,
      height: 100,
      localUri: dataUrl,
    })
    await db.pins.add({
      id: 'pin-prod',
      floorplanId: 'fp-prod',
      title: 'Pin Prod',
      note: '',
      xPct: 20,
      yPct: 40,
      updatedAt: now,
    })
    await db.photos.add({
      id: 'photo-prod',
      pinId: 'pin-prod',
      localUri: dataUrl,
      width: 100,
      height: 100,
      sizeBytes: 2222,
      status: 'pending',
    })
    await db.outbox.add({
      id: 'outbox-prod',
      kind: 'upload_photo',
      entityType: 'photo',
      entityId: 'photo-prod',
      payload: {},
      retries: 0,
    })

    vi.mocked(uploadPhotoClient).mockRejectedValue(new Error('Drive still offline'))
    vi.mocked(uploadFloorplanClient).mockResolvedValue({ driveFileId: 'drive-floor-prod' })
    vi.mocked(writeProjectJsonClient).mockResolvedValue({ driveFileId: 'json-prod' })

    vi.useFakeTimers()
    let summary: Awaited<ReturnType<typeof syncProject>>
    try {
      const syncPromise = syncProject('proj-prod', 'drive-folder-prod')
      await vi.runAllTimersAsync()
      summary = await syncPromise
    } finally {
      vi.useRealTimers()
    }

    const photo = await db.photos.get('photo-prod')
    expect(photo?.status).toBe('error')
    expect(summary.photoStats.failed).toBe(1)
    expect(summary.photoStats.success).toBe(0)
    expect(summary.errors).toContain('Drive still offline')

    const remainingOutbox = await db.outbox
      .where('entityType')
      .equals('photo')
      .and((row) => row.entityId === 'photo-prod')
      .count()
    expect(remainingOutbox).toBe(1)
  })
})
