"use client"

import type { Pin } from "@/lib/types"
import { MapPin } from "lucide-react"
import { getSyncStatusColor } from "@/lib/utils/sync-status"

interface PinMarkerProps {
  pin: Pin
  isSelected: boolean
  onClick: () => void
}

export function PinMarker({ pin, isSelected, onClick }: PinMarkerProps) {
  return (
    <button
      onClick={onClick}
      className="group absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110"
      style={{ left: `${pin.x}px`, top: `${pin.y}px` }}
      aria-label={`Pin: ${pin.title}`}
    >
      <div className="relative">
        <MapPin
          className={`h-8 w-8 drop-shadow-lg transition-colors ${
            isSelected ? "text-(--color-primary)" : "text-(--color-foreground)"
          }`}
          fill="currentColor"
        />
        <div
          className={`absolute top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ${getSyncStatusColor(pin.syncStatus)}`}
        />
      </div>
    </button>
  )
}
