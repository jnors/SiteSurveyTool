import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/google', async () => {
  const actual = await vi.importActual<typeof import('@/lib/google')>('@/lib/google')
  return {
    ...actual,
    deletePhotoClient: vi.fn().mockResolvedValue({ deleted: true }),
  }
})

import { db } from '@/lib/db'
import { deletePhotoRecord } from '@/lib/hooks/use-projects'
import { deletePhotoClient } from '@/lib/google'

describe('deletePhotoRecord', () => {
  const mockedDeletePhotoClient = vi.mocked(deletePhotoClient)

  beforeEach(async () => {
    await db.delete()
    await db.open()
    mockedDeletePhotoClient.mockReset()
    mockedDeletePhotoClient.mockResolvedValue({ deleted: true })
  })

  it('removes the photo row and clears matching outbox entries', async () => {
    const initialIso = '2024-03-18T10:00:00.000Z'
    await db.projects.add({
      id: 'proj-1',
      name: 'Demo Project',
      createdAt: initialIso,
      updatedAt: initialIso,
    })
    await db.floorplans.add({
      id: 'fp-1',
      projectId: 'proj-1',
      name: 'Ground',
      type: 'image/jpeg',
      width: 1024,
      height: 768,
      localUri: 'data:image/jpeg;base64,AAA',
    })
    await db.pins.add({
      id: 'pin-1',
      floorplanId: 'fp-1',
      title: 'Panel',
      note: '',
      xPct: 10,
      yPct: 15,
      updatedAt: initialIso,
    })
    await db.photos.add({
      id: 'photo-1',
      pinId: 'pin-1',
      localUri: 'data:image/jpeg;base64,BBB',
      width: 640,
      height: 480,
      sizeBytes: 12345,
      status: 'pending',
      driveFileId: 'drive-photo-1',
    })
    await db.outbox.add({
      id: 'out-1',
      kind: 'upload_photo',
      entityType: 'photo',
      entityId: 'photo-1',
      payload: {},
      retries: 0,
    })

    const result = await deletePhotoRecord('proj-1', 'photo-1')
    expect(result.deleted).toBe(true)
    expect(result.driveDeleted).toBe(true)
    expect(result.drivePending).toBe(false)
    expect(result.driveError).toBeUndefined()
    expect(mockedDeletePhotoClient).toHaveBeenCalledWith({ driveFileId: 'drive-photo-1' })

    const photo = await db.photos.get('photo-1')
    expect(photo).toBeUndefined()
    const outboxCount = await db.outbox
      .where('entityType')
      .equals('photo')
      .and((row) => row.entityId === 'photo-1')
      .count()
    expect(outboxCount).toBe(0)

    const pin = await db.pins.get('pin-1')
    expect(pin?.updatedAt).not.toBe(initialIso)
    expect(new Date(pin?.updatedAt ?? '').toString()).not.toBe('Invalid Date')

    const project = await db.projects.get('proj-1')
    expect(project?.updatedAt).not.toBe(initialIso)
    expect(new Date(project?.updatedAt ?? '').toString()).not.toBe('Invalid Date')
  })

  it('returns false when the photo does not exist', async () => {
    const initialIso = '2024-03-18T10:00:00.000Z'
    await db.projects.add({
      id: 'proj-2',
      name: 'Demo Project',
      createdAt: initialIso,
      updatedAt: initialIso,
    })
    await db.pins.add({
      id: 'pin-2',
      floorplanId: 'fp-2',
      title: 'Loose wire',
      note: '',
      xPct: 50,
      yPct: 50,
      updatedAt: initialIso,
    })

    const result = await deletePhotoRecord('proj-2', 'missing')
    expect(result.deleted).toBe(false)
    expect(result.driveDeleted).toBe(false)
    expect(result.drivePending).toBe(false)
    expect(mockedDeletePhotoClient).not.toHaveBeenCalled()

    const project = await db.projects.get('proj-2')
    expect(project?.updatedAt).toBe(initialIso)
  })

  it('queues Drive deletion when the API call fails', async () => {
    const initialIso = '2024-03-18T10:00:00.000Z'
    await db.projects.add({
      id: 'proj-3',
      name: 'Demo Project',
      createdAt: initialIso,
      updatedAt: initialIso,
    })
    await db.floorplans.add({
      id: 'fp-3',
      projectId: 'proj-3',
      name: 'Ground',
      type: 'image/jpeg',
      width: 1024,
      height: 768,
      localUri: 'data:image/jpeg;base64,AAA',
    })
    await db.pins.add({
      id: 'pin-3',
      floorplanId: 'fp-3',
      title: 'Panel',
      note: '',
      xPct: 10,
      yPct: 15,
      updatedAt: initialIso,
    })
    await db.photos.add({
      id: 'photo-3',
      pinId: 'pin-3',
      localUri: 'data:image/jpeg;base64,CCC',
      width: 640,
      height: 480,
      sizeBytes: 45678,
      status: 'synced',
      driveFileId: 'drive-photo-3',
    })

    mockedDeletePhotoClient.mockRejectedValueOnce(new Error('Drive unavailable'))

    const result = await deletePhotoRecord('proj-3', 'photo-3')
    expect(result.deleted).toBe(true)
    expect(result.driveDeleted).toBe(false)
    expect(result.drivePending).toBe(true)
    expect(result.driveError).toContain('Drive unavailable')

    const deleteOutbox = await db.outbox.where('kind').equals('delete_photo_drive').toArray()
    expect(deleteOutbox).toHaveLength(1)
    expect(deleteOutbox[0]?.payload).toMatchObject({ driveFileId: 'drive-photo-3' })
    expect(deleteOutbox[0]?.entityId).toBe('photo-3')
  })
})
