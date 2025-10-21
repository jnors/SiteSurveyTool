import type { SyncStatus } from "@/lib/types"

export function getSyncStatusColor(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "bg-[--color-accent-green]"
    case "pending":
      return "bg-[--color-accent-yellow]"
    case "error":
      return "bg-[--color-accent-red]"
    case "syncing":
      return "bg-[--color-accent-blue]"
    default:
      return "bg-[--color-foreground-subtle]"
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
      return "text-[--color-accent-green]"
    case "pending":
      return "text-[--color-accent-yellow]"
    case "error":
      return "text-[--color-accent-red]"
    case "syncing":
      return "text-[--color-accent-blue]"
    default:
      return "text-[--color-foreground-subtle]"
  }
}
