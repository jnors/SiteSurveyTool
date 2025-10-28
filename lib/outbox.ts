import { db, type OutboxRow } from '@/lib/db'

export type OutboxKind = 'create_pin' | 'update_pin' | 'upload_photo' | 'delete_photo_drive'

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

export async function enqueuePhotoDriveDelete(photoId: string, driveFileId: string) {
  await enqueue('delete_photo_drive', 'photo', photoId, { driveFileId })
}

export async function removePhotoOutboxEntries(photoId: string) {
  await db.outbox
    .where('entityType')
    .equals('photo')
    .and((row) => row.entityId === photoId)
    .delete()
}
