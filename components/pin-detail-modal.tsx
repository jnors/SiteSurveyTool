"use client"

import { useState, useEffect } from "react"
import type { Pin } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { getSyncStatusTextColor } from "@/lib/utils/sync-status"
import { CheckCircle2, Clock, AlertCircle, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"

interface PinDetailModalProps {
  pin: Pin | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isNewPin?: boolean
  onSaveNewPin?: (pin: Pin) => void
}

export function PinDetailModal({ pin, open, onOpenChange, isNewPin = false, onSaveNewPin }: PinDetailModalProps) {
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (pin) {
      setTitle(pin.title)
      setNote(pin.note)
    }
  }, [pin])

  if (!pin) return null

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

  const getStatusText = () => {
    switch (pin.syncStatus) {
      case "synced":
        return "Synced"
      case "pending":
        return "Pending sync"
      case "error":
        return "Sync failed"
      case "syncing":
        return "Syncing..."
    }
  }

  const getSaveButtonClass = () => {
    if (pin.syncStatus === "syncing") {
      return "bg-blue-600 hover:bg-blue-700"
    }
    return "bg-green-600 hover:bg-green-700"
  }

  const photoSlots = Array.from({ length: 4 }, (_, i) => pin.photos[i] || null)

  const handleSave = () => {
    if (isNewPin && onSaveNewPin) {
      const newPin: Pin = {
        ...pin,
        pinId: `pin-${Date.now()}`,
        title: title || "New Pin",
        note,
        syncStatus: "pending",
      }
      onSaveNewPin(newPin)
    } else {
      console.log("[v0] Saving pin:", pin.pinId, "with title:", title, "and note:", note)
      // TODO: Implement actual save logic for existing pins
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    console.log("[v0] Deleting pin:", pin.pinId)
    // TODO: Implement actual delete logic
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border border-border bg-background-card text-foreground shadow-2xl transition-all duration-150">
        <DialogHeader>
          {isNewPin ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter pin title..."
              className="border-border bg-background-elevated text-2xl font-semibold text-foreground focus-visible:ring-primary"
            />
          ) : (
            <DialogTitle className="font-semibold text-2xl text-balance">{title}</DialogTitle>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Sync Status Badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${getSyncStatusTextColor(pin.syncStatus)}`}
          >
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>

          {/* Editable Notes */}
          <div className="space-y-2">
            <label htmlFor="pin-note" className="block font-medium text-foreground text-sm">
              Notes
            </label>
            <Textarea
              id="pin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px] resize-none border-border bg-background-elevated text-foreground leading-relaxed focus-visible:ring-primary"
              placeholder="Add notes about this location..."
            />
          </div>

          {/* Photo Gallery - Always 4 slots */}
          <div className="space-y-3">
            <label className="block font-medium text-foreground text-sm">
              Photos ({pin.photos.length}/4)
              {isNewPin && <span className="ml-2 text-foreground-muted text-xs">(Add photos after saving)</span>}
            </label>
            <div className="grid grid-cols-2 gap-4">
              {photoSlots.map((photo, index) => (
                <div
                  key={index}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-background-elevated transition-all duration-150 hover:border-border-hover"
                >
                  {photo ? (
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`${title} photo ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-150 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-foreground-muted text-sm">
                      No photo
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 border-border border-t pt-6 sm:flex-row sm:justify-between">
            {!isNewPin && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-2 border-red-600/50 text-red-600 hover:border-red-600 hover:bg-red-600/10 sm:order-1 bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
                Delete Pin
              </Button>
            )}

            {/* Save & Cancel - Right side */}
            <div className={`flex gap-3 ${isNewPin ? "sm:ml-auto" : "sm:order-2"}`}>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground-muted hover:bg-background-elevated"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className={`gap-2 ${getSaveButtonClass()}`}>
                {pin.syncStatus === "syncing" && <Loader2 className="h-4 w-4 animate-spin" />}
                {isNewPin ? "Save Pin" : "Save & Sync"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
