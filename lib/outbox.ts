import { db, type OutboxRow } from '@/lib/db'

export type OutboxKind = 'create_pin' | 'update_pin' | 'upload_photo'

export async function enqueue(kind: OutboxKind, entityType: OutboxRow['entityType'], entityId: string, payload: any = {}) {
  const row: OutboxRow = {
    id: `${kind}-${entityType}-${entityId}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    kind,
    entityType,
    entityId,
    payload,
    retries: 0,
    lastTriedAt: undefined,
  }
  await db.outbox.add(row)
}

export async function enqueuePhotoUpload(photoId: string) {
  await enqueue('upload_photo', 'photo', photoId, {})
}

// Process all outbox items locally (stub):
// - For photo uploads: set Photo.status syncing → success (synced) or error; remove or retain outbox item
// - For pin create/update: no-op but simulate delay and remove item
export async function processOutbox({ failRate = 0.1 }: { failRate?: number } = {}) {
  const items = await db.outbox.toArray()
  const nowIso = new Date().toISOString()

  for (const item of items) {
    switch (item.entityType) {
      case 'photo': {
        const photo = await db.photos.get(item.entityId)
        if (!photo) {
          await db.outbox.delete(item.id)
          continue
        }
        // Transition to syncing
        await db.photos.update(photo.id, { status: 'syncing' })
        await delay(250)
        const failed = Math.random() < failRate
        if (!failed) {
          await db.photos.update(photo.id, { status: 'synced' })
          await db.outbox.delete(item.id)
        } else {
          await db.photos.update(photo.id, { status: 'error' })
          await db.outbox.update(item.id, { retries: item.retries + 1, lastTriedAt: nowIso })
        }
        break
      }
      case 'pin': {
        // Simulate pin create/update success
        await delay(150)
        await db.outbox.delete(item.id)
        break
      }
      case 'project':
      case 'floorplan': {
        await delay(100)
        await db.outbox.delete(item.id)
        break
      }
      default: {
        await db.outbox.delete(item.id)
      }
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

