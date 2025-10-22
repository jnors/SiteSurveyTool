import Dexie, { Table } from 'dexie'

export type SyncStatus = 'synced' | 'pending' | 'error' | 'syncing'

export interface ProjectRow {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  driveFolderId?: string
  syncedAt?: string
}

export interface FloorplanRow {
  id: string
  projectId: string
  name: string
  type: string
  width: number
  height: number
  localUri: string
  driveFileId?: string
}

export interface PinRow {
  id: string
  floorplanId: string
  title: string
  note: string
  xPct: number
  yPct: number
  updatedAt: string
}

export interface PhotoRow {
  id: string
  pinId: string
  localUri: string
  width: number
  height: number
  sizeBytes: number
  driveFileId?: string
  status: SyncStatus
}

export interface OutboxRow {
  id: string
  kind: string
  entityType: 'project' | 'floorplan' | 'pin' | 'photo'
  entityId: string
  payload: any
  retries: number
  lastTriedAt?: string
}

export class SSTDB extends Dexie {
  projects!: Table<ProjectRow, string>
  floorplans!: Table<FloorplanRow, string>
  pins!: Table<PinRow, string>
  photos!: Table<PhotoRow, string>
  outbox!: Table<OutboxRow, string>

  constructor() {
    super('sst_db')
    this.version(1).stores({
      projects: '&id, name, updatedAt, syncedAt',
      floorplans: '&id, projectId',
      pins: '&id, floorplanId, updatedAt',
      photos: '&id, pinId, status',
      outbox: '&id, entityType, entityId, kind',
    })
  }
}

export const db = new SSTDB()

