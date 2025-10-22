"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useProject } from "@/lib/hooks/use-projects"
import { NavBar } from "@/components/nav-bar"
import { SyncBanner } from "@/components/sync-banner"
import { PinMarker } from "@/components/pin-marker"
import { PinSidebar } from "@/components/pin-sidebar"
import { PinDetailModal } from "@/components/pin-detail-modal"
import { AddPinButton } from "@/components/add-pin-button"
import { ToastNotification } from "@/components/toast-notification"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Pin } from "@/lib/types"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { project, isLoading, addPin, addPhotos, syncAll } = useProject(projectId)
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isAddingPin, setIsAddingPin] = useState(false)
  const [newPinPosition, setNewPinPosition] = useState<{ xPct: number; yPct: number } | null>(null)
  const [showToast, setShowToast] = useState(false)
  const floorplanRef = useRef<HTMLDivElement>(null)

  const handleFloorplanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPin || !floorplanRef.current) return

    const rect = floorplanRef.current.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100

    // Create temporary new pin
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

  const handleSaveNewPin = (pin: Pin) => {
    if (addPin) {
      addPin(pin)
      setShowToast(true)
      setNewPinPosition(null)
    }
  }

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

  const isOffline = project.status === "error"

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <SyncBanner status={project.status} onSync={syncAll} />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-4 gap-2 text-foreground-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="font-bold text-3xl text-foreground">{project.name}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Floorplan Viewer */}
          <div className="overflow-hidden rounded-lg border border-border bg-background-card">
            {isAddingPin && (
              <div className="border-b border-border bg-primary/10 px-4 py-2 text-center text-primary text-sm">
                Tap anywhere on the floorplan to add a new pin.
              </div>
            )}
            <div
              ref={floorplanRef}
              className={`relative aspect-[3/2] w-full ${isAddingPin ? "cursor-crosshair" : ""}`}
              onClick={handleFloorplanClick}
            >
              <Image
                src={project.floorplanUrl || "/placeholder.svg"}
                alt={`${project.name} floorplan`}
                fill
                className="object-contain"
              />
              {/* Pin Markers */}
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

          {/* Sidebar */}
          <div>
            {selectedPin && !isAddingPin ? (
              <PinSidebar pin={selectedPin} onViewDetails={() => setModalOpen(true)} />
            ) : (
              <div className="rounded-lg border border-border bg-background-card p-6 text-center">
                <p className="text-foreground-muted text-sm">Select a pin on the floorplan to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddPinButton onClick={() => setIsAddingPin(!isAddingPin)} disabled={isOffline} isActive={isAddingPin} />

      <ToastNotification
        message="New pin added — remember to sync."
        show={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Pin Detail Modal */}
      <PinDetailModal
        pin={selectedPin}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isNewPin={selectedPin?.pinId.startsWith("temp-")}
        onSaveNewPin={handleSaveNewPin}
        onAddPhotos={async (pinId, files) => {
          await addPhotos(pinId, files)
          setSelectedPin((prev) => (prev ? { ...prev, photos: project?.pins.find(p => p.pinId === pinId)?.photos || prev.photos } : prev))
        }}
      />
    </div>
  )
}
