'use client'

import { useState } from "react"
import Link from "next/link"
import { Trash2 } from "lucide-react"

import type { Project } from "@/lib/types"
import { Card } from "@/ui/ds/Card"
import { BadgeStatus } from "@/ui/ds/BadgeStatus"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProjectCardProps {
  project: Project
  movedOrMissing?: boolean
  onDelete?: (projectId: string) => Promise<void>
}

export function ProjectCard({ project, movedOrMissing = false, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(project.projectId)
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPins = project.floorplans.reduce((sum, floorplan) => sum + floorplan.pinCount, 0)
  const syncAnomalyLabel = project.syncAnomaly === "missing" ? "Re-create" : "Relink"
  const showAnomalyBadge = movedOrMissing || Boolean(project.syncAnomaly)

  return (
    <div className="relative group">
      <Link href={`/projects/${project.projectId}`} prefetch className="block">
        <Card interactive className="bg-background-card p-6 transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-foreground">{project.name}</h3>
              <p className="text-sm text-foreground-muted">Last synced: {formatDate(project.lastSynced)}</p>
              <p className="mt-1 text-xs text-foreground-subtle">
                {totalPins} pin{totalPins !== 1 ? "s" : ""} | {project.floorplans.length} floorplan
                {project.floorplans.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-foreground">
              <BadgeStatus status={project.status === "syncing" ? "syncing" : project.status} />
              {showAnomalyBadge && <BadgeStatus status="blocked" label={syncAnomalyLabel} subdued />}
            </div>
          </div>
        </Card>
      </Link>

      {onDelete && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{project.name}" and all its data from your device.
                  If synced, it will also be moved to trash in Google Drive.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
