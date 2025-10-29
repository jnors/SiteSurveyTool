export type SyncStatus = "synced" | "pending" | "error" | "syncing"
export type SyncAnomaly = "moved" | "missing"

export interface PinPhoto {
  photoId: string
  localUri: string
  width: number
  height: number
  sizeBytes: number
  status: SyncStatus
  driveFileId?: string
}

export interface Pin {
  pinId: string
  xPct: number
  yPct: number
  title: string
  note: string
  photos: PinPhoto[]
  syncStatus: SyncStatus
}

export interface DeletePhotoResult {
  deleted: boolean
  driveDeleted: boolean
  drivePending: boolean
  driveError?: string
}

export interface Floorplan {
  floorplanId: string
  name: string
  localUri: string
  width: number
  height: number
  driveFileId?: string
  pinCount: number
}

export interface Project {
  projectId: string
  name: string
  lastSynced: string
  status: SyncStatus
  activeFloorplanId: string | null
  floorplans: Floorplan[]
  pins: Pin[]
  syncAnomaly: SyncAnomaly | null
}
