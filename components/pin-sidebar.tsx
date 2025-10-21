"use client"

import type { Pin } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { getSyncStatusTextColor } from "@/lib/utils/sync-status"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"

interface PinSidebarProps {
  pin: Pin
  onViewDetails: () => void
}

export function PinSidebar({ pin, onViewDetails }: PinSidebarProps) {
  const getStatusIcon = () => {
    switch (pin.syncStatus) {
      case "synced":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "syncing":
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <Card className="border-(--color-border) bg-(--color-background-card) p-4">
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 font-semibold text-(--color-foreground) text-lg">{pin.title}</h3>
          <div className={`flex items-center gap-2 ${getSyncStatusTextColor(pin.syncStatus)}`}>
            {getStatusIcon()}
            <span className="text-xs">
              {pin.syncStatus === "synced" && "Synced"}
              {pin.syncStatus === "pending" && "Pending sync"}
              {pin.syncStatus === "error" && "Sync failed"}
              {pin.syncStatus === "syncing" && "Syncing..."}
            </span>
          </div>
        </div>

        <p className="text-(--color-foreground-muted) text-sm leading-relaxed">{pin.note}</p>

        <div>
          <p className="mb-2 font-medium text-(--color-foreground-muted) text-xs">PHOTOS ({pin.photos.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {pin.photos.slice(0, 4).map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded border border-(--color-border) bg-(--color-background-elevated)"
              >
                <Image src={photo || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onViewDetails}
          className="w-full rounded-md bg-(--color-primary) px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-(--color-primary-hover)"
        >
          View Full Details
        </button>
      </div>
    </Card>
  )
}
