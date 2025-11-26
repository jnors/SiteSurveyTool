"use client"

import { useEffect, useRef, useState } from "react"
import type { DeletePhotoResult, Pin, PinPhoto } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Trash2 } from "lucide-react"
import Image from "next/image"

interface PinPhotoGalleryProps {
    pin: Pin
    isNewPin: boolean
    onAddPhotos?: (pinId: string, files: File[]) => Promise<void> | void
    onDeletePhoto?: (photoId: string) => Promise<DeletePhotoResult | void> | DeletePhotoResult | void
    uploadDisabled?: boolean
    uploadDisabledReason?: string
    onDeleteNotice?: (notice: { text: string; tone: "warning" | "error" } | null) => void
}

export function PinPhotoGallery({
    pin,
    isNewPin,
    onAddPhotos,
    onDeletePhoto,
    uploadDisabled = false,
    uploadDisabledReason,
    onDeleteNotice,
}: PinPhotoGalleryProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)
    const [previewDims, setPreviewDims] = useState<{ w: number; h: number } | null>(null)
    const [photoToDelete, setPhotoToDelete] = useState<PinPhoto | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const fileInputId = `pin-photo-input-${pin.pinId}`

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

    const photoSlots: (PinPhoto | null)[] = Array.from({ length: 4 }, (_, i) => pin.photos[i] ?? null)

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
            onDeleteNotice?.(notice)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Drive deletion failed"
            onDeleteNotice?.({
                text: `Drive deletion request failed: ${message}`,
                tone: "error",
            })
        } finally {
            setIsDeleting(false)
            setPhotoToDelete(null)
        }
    }

    return (
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
                                        alt={`${pin.title} photo ${index + 1}`}
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

            {/* Photo Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[90vh] w-[min(92vw,900px)] overflow-hidden border border-border bg-background-card p-0 text-foreground shadow-2xl">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-lg font-semibold">{pin.title} — Photo {previewIndex !== null ? previewIndex + 1 : ''}</DialogTitle>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                        <div className="relative mx-auto aspect-video w-full max-h-[60vh]">
                            {previewIndex !== null && pin.photos[previewIndex] && (
                                <Image
                                    src={pin.photos[previewIndex]?.localUri || "/placeholder.svg"}
                                    alt={`${pin.title} large preview`}
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

            {/* Delete Photo Confirmation */}
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
                    </DialogHeader>
                    <p className="text-sm text-foreground-muted">
                        This deletes the photo from this pin. This action cannot be undone.
                    </p>
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
        </div>
    )
}
