import { db, type OutboxRow } from '@/lib/db'

export type OutboxKind = 'create_pin' | 'update_pin' | 'upload_photo'

export async function enqueue(kind: OutboxKind, entityType: OutboxRow['entityType'], entityId: string, payload: any = {}) {
  const row: OutboxRow = {
    id: `${kind}-${entityType}-${entityId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
