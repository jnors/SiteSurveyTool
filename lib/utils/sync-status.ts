import type { SyncStatus } from "@/lib/types"

export function getSyncStatusColor(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "bg-accent-green"
    case "pending":
      return "bg-accent-yellow"
    case "error":
      return "bg-accent-red"
    case "syncing":
      return "bg-accent-blue"
    default:
      return "bg-foreground-subtle"
  }
}

export function getSyncStatusText(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "All items synced"
    case "pending":
      return "Pending sync"
    case "error":
      return "Sync failed"
    case "syncing":
      return "Syncing"
    default:
      return "Unknown status"
  }
}

export function getSyncStatusTextColor(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "text-accent-green"
    case "pending":
      return "text-accent-yellow"
    case "error":
      return "text-accent-red"
    case "syncing":
      return "text-accent-blue"
    default:
      return "text-foreground-subtle"
  }
}
