"use client"

import { useEffect, useRef, useState } from "react"
import type { DeletePhotoResult, Pin, PinPhoto } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Trash2 } from "lucide-react"
import { BadgeStatus } from "@/ui/ds/BadgeStatus"
import Image from "next/image"

interface PinDetailModalProps {
  pin: Pin | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isNewPin?: boolean
  onSaveNewPin?: (pin: Pin) => void
  onAddPhotos?: (pinId: string, files: File[]) => Promise<void> | void
  onDeletePhoto?: (photoId: string) => Promise<DeletePhotoResult | void> | DeletePhotoResult | void
  uploadDisabled?: boolean
  uploadDisabledReason?: string
}

export function PinDetailModal({
  pin,
  open,
  onOpenChange,
  isNewPin = false,
  onSaveNewPin,
  onAddPhotos,
  onDeletePhoto,
  uploadDisabled = false,
  uploadDisabledReason,
}: PinDetailModalProps) {
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputId = "pin-photo-input"
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [previewDims, setPreviewDims] = useState<{ w: number; h: number } | null>(null)
  const [photoToDelete, setPhotoToDelete] = useState<PinPhoto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteNotice, setDeleteNotice] = useState<{ text: string; tone: "warning" | "error" } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (pin) {
      setTitle(pin.title)
      setNote(pin.note)
      setDeleteNotice(null)
    }
  }, [pin])

  useEffect(() => {
    if (previewIndex !== null) {
      const nextPhoto = pin?.photos[previewIndex]
      if (!nextPhoto) {
        setPreviewOpen(false)
        setPreviewIndex(null)
      }
    }
  }, [pin, previewIndex])

  useEffect(() => {
    setPhotoToDelete(null)
  }, [pin?.pinId])

  if (!pin) return null

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

  const photoSlots: (PinPhoto | null)[] = Array.from({ length: 4 }, (_, i) => pin.photos[i] ?? null)

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

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || !onAddPhotos || !pin || isNewPin || uploadDisabled) return
    setIsUploading(true)
    try {
      await onAddPhotos(pin.pinId, Array.from(files))
    } finally {
      setIsUploading(false)
    }
  }

  const photosActionDisabled = uploadDisabled || isNewPin
  const photosDisabledReason = photosActionDisabled
    ? isNewPin
      ? "Save pin before attaching photos"
      : uploadDisabledReason ?? "Offline - reconnect to attach photos"
    : undefined

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete || !onDeletePhoto) {
      setPhotoToDelete(null)
      return
    }
    setIsDeleting(true)
    try {
      const result = (await onDeletePhoto(photoToDelete.photoId)) as DeletePhotoResult | void
      if (previewIndex !== null && pin?.photos[previewIndex]?.photoId === photoToDelete.photoId) {
        setPreviewOpen(false)
        setPreviewIndex(null)
      }
      let notice: { text: string; tone: "warning" | "error" } | null = null
      if (result && typeof result === "object") {
        if (!result.deleted) {
          notice = {
            text: "Photo could not be removed. It may have already been deleted.",
            tone: "error",
          }
        } else if (result.driveError) {
          notice = {
            text: `Photo deleted locally, but Drive removal failed: ${result.driveError}`,
            tone: "error",
          }
        } else if (result.drivePending) {
          notice = {
            text: "Photo deleted locally. Drive removal will retry on the next sync while online.",
            tone: "warning",
          }
        }
      }
      setDeleteNotice(notice)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Drive deletion failed"
      setDeleteNotice({
        text: `Drive deletion request failed: ${message}`,
        tone: "error",
      })
    } finally {
      setIsDeleting(false)
      setPhotoToDelete(null)
    }
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
          <BadgeStatus
            status={pin.syncStatus === "syncing" ? "syncing" : pin.syncStatus}
            label={getStatusText() ?? undefined}
          />

          {deleteNotice && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                deleteNotice.tone === "error"
                  ? "border-[#EA4335]/60 bg-[#EA4335]/10 text-[#EA4335]"
                  : "border-[#F9AB00]/60 bg-[#F9AB00]/10 text-[#F9AB00]"
              }`}
            >
              {deleteNotice.text}
            </div>
          )}

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
                  key={photo?.photoId ?? index}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-background-elevated transition-all duration-150 hover:border-border-hover"
                >
                  {photo ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewIndex(index)
                          setPreviewDims(null)
                          setPreviewOpen(true)
                        }}
                        className="absolute inset-0"
                        aria-label={`View photo ${index + 1}`}
                      >
                        <Image
                          src={photo.localUri || "/placeholder.svg"}
                          alt={`${title} photo ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-150 group-hover:scale-105"
                        />
                      </button>
                      {!isNewPin && onDeletePhoto && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setPhotoToDelete(photo)
                          }}
                          className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border border-border/80 bg-background-card/90 text-foreground-muted transition-colors duration-150 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                          aria-label={`Delete photo ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  ) : photosActionDisabled ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex h-full cursor-not-allowed items-center justify-center text-foreground-muted text-sm opacity-60">
                          Add photo
                        </span>
                      </TooltipTrigger>
                      {photosDisabledReason ? <TooltipContent>{photosDisabledReason}</TooltipContent> : null}
                    </Tooltip>
                  ) : (
                    <label
                      htmlFor={fileInputId}
                      className="flex h-full cursor-pointer items-center justify-center text-foreground-muted text-sm transition-colors duration-150 hover:text-foreground"
                    >
                      {isUploading ? "Uploading..." : "Add photo"}
                    </label>
                  )}
                </div>
              ))}
            </div>
            {!isNewPin && pin.photos.length < 4 && (
              <div className="flex items-center gap-3">
                <input
                  id={fileInputId}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleAddPhotos(e.target.files)}
                  ref={fileInputRef}
                  disabled={uploadDisabled}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (photosActionDisabled) return
                          fileInputRef.current?.click()
                        }}
                        className="border-border text-foreground hover:bg-background-elevated"
                        disabled={isUploading || photosActionDisabled}
                      >
                        {isUploading ? "Processing..." : "Attach Photos"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {photosDisabledReason ? <TooltipContent>{photosDisabledReason}</TooltipContent> : null}
                </Tooltip>
                <span className="text-foreground-muted text-xs">Max 4 photos, resized to 1080p JPEG</span>
              </div>
            )}
          </div>

          {/* Photo Preview Dialog */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-h-[90vh] w-[min(92vw,900px)] overflow-hidden border border-border bg-background-card p-0 text-foreground shadow-2xl">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-lg font-semibold">{title} — Photo {previewIndex !== null ? previewIndex + 1 : ''}</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6">
                <div className="relative mx-auto aspect-video w-full max-h-[60vh]">
                  {previewIndex !== null && pin.photos[previewIndex] && (
                    <Image
                      src={pin.photos[previewIndex]?.localUri || "/placeholder.svg"}
                      alt={`${title} large preview`}
                      fill
                      className="object-contain"
                      onLoadingComplete={(img) => setPreviewDims({ w: img.naturalWidth, h: img.naturalHeight })}
                    />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-foreground-muted text-sm">
                    {previewDims && (
                      <span>Resolution: {previewDims.w}×{previewDims.h}px</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewOpen(false)} className="border-border text-foreground hover:bg-background-elevated">Close</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={Boolean(photoToDelete)} onOpenChange={(next) => {
            if (!next && !isDeleting) {
              setPhotoToDelete(null)
            }
          }}>
            <DialogContent
              className="max-w-sm border border-border bg-background-card text-foreground shadow-2xl"
              showCloseButton={false}
            >
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Delete photo?</DialogTitle>
                <DialogDescription>
                  This deletes the photo from this pin. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPhotoToDelete(null)}
                  className="border-border text-foreground-muted hover:bg-background-elevated"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeletePhoto}
                  className="gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete photo"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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


