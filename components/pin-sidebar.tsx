"use client"

import type { Pin } from "@/lib/types"
import { Card } from "@/ui/ds/Card"
import { BadgeStatus } from "@/ui/ds/BadgeStatus"
import { Button } from "@/ui/ds/Button"
import Image from "next/image"

interface PinSidebarProps {
  pin: Pin
  onViewDetails: () => void
}

export function PinSidebar({ pin, onViewDetails }: PinSidebarProps) {
  return (
    <Card className="bg-background-card p-4">
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 font-semibold text-(--color-foreground) text-lg">{pin.title}</h3>
          <BadgeStatus status={pin.syncStatus === "syncing" ? "syncing" : pin.syncStatus} />
        </div>

        <p className="text-foreground-muted text-sm leading-relaxed">{pin.note}</p>

        <div>
        <p className="mb-2 font-medium text-foreground-muted text-xs">PHOTOS ({pin.photos.length})</p>
        <div className="grid grid-cols-2 gap-2">
          {pin.photos.slice(0, 4).map((photo, index) => (
            <div
              key={photo.photoId ?? index}
              className="relative aspect-square overflow-hidden rounded border border-border bg-background-elevated"
            >
              <Image src={photo.localUri || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>

        <Button fullWidth onClick={onViewDetails}>
          View Full Details
        </Button>
      </div>
    </Card>
  )
}
