'use client'

import Image from 'next/image'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Floorplan } from '@/lib/types'

type FloorplanSwitcherProps = {
  floorplans: Floorplan[]
  activeFloorplanId: string | null
  onSelect: (floorplanId: string) => void
  onDelete?: (floorplanId: string) => void
  disabled?: boolean
}

export function FloorplanSwitcher({
  floorplans,
  activeFloorplanId,
  onSelect,
  onDelete,
  disabled,
}: FloorplanSwitcherProps) {
  if (!floorplans.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {floorplans.map((floorplan) => {
        const isActive = floorplan.floorplanId === activeFloorplanId
        const canDelete = floorplans.length > 1 && onDelete

        return (
          <div key={floorplan.floorplanId} className="relative group/floorplan">
            <button
              type="button"
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onSelect(floorplan.floorplanId)}
              className={cn(
                'group flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive
                  ? 'border-primary/80 bg-primary/10 text-primary shadow-[0_0_0_3px_rgba(138,180,248,0.2)]'
                  : 'border-border/60 text-foreground-muted hover:border-primary/70 hover:text-primary',
                disabled && 'opacity-50',
              )}
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-md border border-border/50 bg-background-card">
                <Image
                  src={floorplan.localUri || '/placeholder.svg'}
                  alt={`${floorplan.name} thumbnail`}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-150 group-hover:scale-105"
                />
              </div>
              <span className="font-medium">{floorplan.name}</span>
              <span className="rounded-full bg-border/60 px-2 py-0.5 text-xs text-foreground-muted">
                {floorplan.pinCount}
              </span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(floorplan.floorplanId)
                }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border/80 bg-background-card text-foreground-muted opacity-0 transition-opacity hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 group-hover/floorplan:opacity-100 focus:opacity-100"
                aria-label={`Delete ${floorplan.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
