export type SyncStatus = "synced" | "pending" | "error" | "syncing"

export interface Pin {
  pinId: string
  xPct: number
  yPct: number
  title: string
  note: string
  photos: string[]
  syncStatus: SyncStatus
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
}
