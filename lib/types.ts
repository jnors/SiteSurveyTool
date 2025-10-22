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

export interface Project {
  projectId: string
  name: string
  lastSynced: string
  status: SyncStatus
  floorplanUrl: string
  pins: Pin[]
}
