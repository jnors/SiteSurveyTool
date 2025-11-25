"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { AddFloorplanButton } from "@/components/add-floorplan-button"
import { AddPinButton } from "@/components/add-pin-button"
import { AuthGate, NavBar, OfflineBanner, SyncBar } from "@/ui"
import { FloorplanSwitcher } from "@/components/floorplan-switcher"
import { PinDetailModal } from "@/components/pin-detail-modal"
import { PinMarker } from "@/components/pin-marker"
import { PinSidebar } from "@/components/pin-sidebar"
import { ToastNotification } from "@/components/toast-notification"
import { Button } from "@/components/ui/button"
import { useActiveFloorplan, useProject } from "@/lib/hooks/use-projects"
import { useAuth } from "@/lib/useAuth"
import { useOnline } from "@/lib/useOnline"
import type { Pin } from "@/lib/types"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [selectedFloorplanId, setSelectedFloorplanId] = useState<string | null>(null)
  const {
    project,
    isLoading,
    activeFloorplanId: resolvedActiveFloorplanId,
    addPin,
    addPhotos,
    deletePhoto,
    addFloorplan,
    syncAll,
  } = useProject(projectId, selectedFloorplanId)
  const floorplanOptions = useMemo(
    () => (project?.floorplans ?? []).map((fp) => ({ id: fp.floorplanId })),
    [project],
  )
  const { activeFloorplanId, setActiveFloorplanId } = useActiveFloorplan(floorplanOptions)

  const auth = useAuth("/projects")
  const isOnline = useOnline()
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isAddingPin, setIsAddingPin] = useState(false)
  const [newPinPosition, setNewPinPosition] = useState<{ xPct: number; yPct: number } | null>(null)
  const [showPinToast, setShowPinToast] = useState(false)
  const [showFloorplanToast, setShowFloorplanToast] = useState(false)
  const [syncProgress, setSyncProgress] = useState<string | undefined>(undefined)
  const [isSyncing, setIsSyncing] = useState(false)
  const floorplanRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeFloorplanId && resolvedActiveFloorplanId) {
      setSelectedFloorplanId(resolvedActiveFloorplanId)
    }
  }, [activeFloorplanId, resolvedActiveFloorplanId])

  useEffect(() => {
    if (activeFloorplanId && activeFloorplanId !== selectedFloorplanId) {
      setSelectedFloorplanId(activeFloorplanId)
      setIsAddingPin(false)
      setNewPinPosition(null)
      setSelectedPin(null)
      setModalOpen(false)
    }
  }, [activeFloorplanId, selectedFloorplanId])

  const activeFloorplan = useMemo(() => {
    const currentId = activeFloorplanId ?? resolvedActiveFloorplanId
    if (!project) return null
    return project.floorplans.find((fp) => fp.floorplanId === currentId) ?? project.floorplans[0] ?? null
  }, [project, activeFloorplanId, resolvedActiveFloorplanId])

  const handleFloorplanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPin || !floorplanRef.current || !activeFloorplan) return

    const rect = floorplanRef.current.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100

    const tempPin: Pin = {
      pinId: `temp-${Date.now()}`,
      xPct,
      yPct,
      title: "New Pin",
      note: "",
      photos: [],
      syncStatus: "pending",
    }

    setNewPinPosition({ xPct, yPct })
    setSelectedPin(tempPin)
    setModalOpen(true)
    setIsAddingPin(false)
  }

  const handleSaveNewPin = async (pin: Pin) => {
    await addPin(pin)
    setShowPinToast(true)
    setNewPinPosition(null)
  }

  const handleAddFloorplan = async (file: File) => {
    const result = await addFloorplan(file)
    setActiveFloorplanId(result.floorplanId)
    setShowFloorplanToast(true)
    return result
  }

  useEffect(() => {
    if (!project) return
    setSelectedPin((prev) => {
      if (!prev) return prev
      const updated = project.pins.find((pin) => pin.pinId === prev.pinId)
      if (!updated) return prev
      return updated
    })
  }, [project])

  const queueStats = useMemo(() => {
    if (!project) return { pending: 0, errors: 0 }
    let pending = 0
    let errors = 0
    if (project.status === "pending" || project.status === "syncing") pending += 1
    if (project.status === "error") errors += 1
    for (const pin of project.pins) {
      if (pin.syncStatus === "pending" || pin.syncStatus === "syncing") pending += 1
      if (pin.syncStatus === "error") errors += 1
      pending += pin.photos.filter((photo) => photo.status === "pending" || photo.status === "syncing").length
      errors += pin.photos.filter((photo) => photo.status === "error").length
    }
    return { pending, errors }
  }, [project])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-2xl text-foreground">Project not found</h1>
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }
  const projectLastSyncedIso = project.lastSynced
  const hasSyncError = project.status === "error"
  const syncBlocked = hasSyncError && isOnline
  const missingFloorplan = !activeFloorplan
  const addPinDisabled = syncBlocked || missingFloorplan
  const addPinDisabledReason = syncBlocked
    ? "Resolve sync error to add new pins"
    : missingFloorplan
      ? "Add a floorplan before placing pins"
      : undefined

  const syncDisabledReason = !auth.isAuthenticated
    ? "Sign in to sync with Google Drive"
    : !isOnline
      ? "Offline - sync resumes when you reconnect"
      : undefined

  const isPro = auth.subscriptionStatus === 'active'

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <OfflineBanner />
      <AuthGate status={auth.status} isAuthenticated={auth.isAuthenticated}>
        <SyncBar
          status={isSyncing ? 'syncing' : project.status}
          pendingCount={queueStats.pending}
          errorCount={queueStats.errors}
          lastSyncedIso={projectLastSyncedIso ?? undefined}
          onSync={async () => {
            setIsSyncing(true)
            setSyncProgress('Starting sync...')
            try {
              await syncAll((message) => setSyncProgress(message))
            } finally {
              setSyncProgress(undefined)
              setIsSyncing(false)
            }
          }}
          disabledReason={syncDisabledReason}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
        />

        <main className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-6">
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="mb-4 gap-2 text-foreground-muted">
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FloorplanSwitcher
                  floorplans={project.floorplans}
                  activeFloorplanId={activeFloorplan?.floorplanId ?? null}
                  onSelect={setActiveFloorplanId}
                  disabled={isLoading}
                />
                <AddFloorplanButton
                  onAdd={handleAddFloorplan}
                  disabled={!isOnline || (!isPro && (project?.floorplans.length ?? 0) >= 1)}
                  disabledReason={
                    !isOnline
                      ? "Offline - reconnect to add floorplans"
                      : !isPro && (project?.floorplans.length ?? 0) >= 1
                        ? "Free plan limited to 1 floorplan. Upgrade to add more."
                        : undefined
                  }
                />
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-background-card">
                {isAddingPin && (
                  <div className="border-b border-border bg-primary/10 px-4 py-2 text-center text-sm text-primary">
                    Tap anywhere on the floorplan to add a new pin.
                  </div>
                )}
                <div
                  ref={floorplanRef}
                  className={`relative aspect-[3/2] w-full ${isAddingPin ? "cursor-crosshair" : ""}`}
                  onClick={handleFloorplanClick}
                >
                  <Image
                    key={activeFloorplan?.floorplanId ?? "floorplan-placeholder"}
                    src={activeFloorplan?.localUri || "/placeholder.svg"}
                    alt={`${project.name} ${activeFloorplan?.name ?? "floorplan"}`}
                    fill
                    unoptimized
                    className="object-contain transition-opacity duration-150"
                  />
                  {project.pins.map((pin) => (
                    <PinMarker
                      key={pin.pinId}
                      pin={pin}
                      isSelected={selectedPin?.pinId === pin.pinId}
                      onClick={() => {
                        if (!isAddingPin) {
                          setSelectedPin(pin)
                        }
                      }}
                    />
                  ))}
                  {newPinPosition && (
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 animate-pulse"
                      style={{ left: `${newPinPosition.xPct}%`, top: `${newPinPosition.yPct}%` }}
                    >
                      <div className="h-6 w-6 rounded-full border-2 border-yellow-500 bg-yellow-500/20" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              {selectedPin && !isAddingPin ? (
                <PinSidebar pin={selectedPin} onViewDetails={() => setModalOpen(true)} />
              ) : (
                <div className="rounded-lg border border-border bg-background-card p-6 text-center">
                  <p className="text-sm text-foreground-muted">Select a pin on the floorplan to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <AddPinButton
          onClick={() => setIsAddingPin(!isAddingPin)}
          disabled={addPinDisabled}
          disabledReason={addPinDisabledReason}
          isActive={isAddingPin}
        />

        <ToastNotification
          message="New floorplan added - remember to sync."
          show={showFloorplanToast}
          onClose={() => setShowFloorplanToast(false)}
        />

        <ToastNotification
          message="New pin added - remember to sync."
          show={showPinToast}
          onClose={() => setShowPinToast(false)}
        />

        <PinDetailModal
          pin={selectedPin}
          open={modalOpen}
          onOpenChange={setModalOpen}
          isNewPin={selectedPin?.pinId.startsWith("temp-")}
          onSaveNewPin={handleSaveNewPin}
          onAddPhotos={async (pinId, files) => {
            await addPhotos(pinId, files)
          }}
          onDeletePhoto={deletePhoto}
          uploadDisabled={false}
        />
      </AuthGate>
    </div>
  )
}
