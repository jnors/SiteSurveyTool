'use client'

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type ProjectCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  onProjectNameChange: (value: string) => void
  floorplanFile: File | null
  onFloorplanChange: (file: File | null) => void
  onSubmit: () => Promise<void> | void
  isSaving: boolean
  errorMessage?: string
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  projectName,
  onProjectNameChange,
  floorplanFile,
  onFloorplanChange,
  onSubmit,
  isSaving,
  errorMessage,
}: ProjectCreateDialogProps) {
  const saveDisabled = isSaving || !projectName.trim() || !floorplanFile

  const selectedFileName = useMemo(() => {
    if (!floorplanFile) return ''
    return floorplanFile.name || 'Selected image'
  }, [floorplanFile])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] text-foreground">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Name your project and attach the primary floorplan image. Images are resized to 1080p JPEG for offline
            storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="project-name">
              Project name
            </label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              placeholder="Warehouse A — North Wing"
              autoFocus
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="floorplan-image">
              Floorplan image (JPEG/PNG)
            </label>
            <Input
              id="floorplan-image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                onFloorplanChange(file ?? null)
              }}
            />
            <p className="text-xs text-foreground-muted">Required • Resized to max 1080p • JPEG output only</p>
            {selectedFileName && <p className="text-xs text-primary">{selectedFileName}</p>}
          </div>

          {errorMessage ? <p className="text-sm text-[#EA4335]">{errorMessage}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              if (!isSaving) {
                onOpenChange(false)
              }
            }}
            disabled={isSaving}
            className="text-foreground-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            className="gap-2 bg-primary text-black hover:bg-primary/90"
            onClick={async () => {
              if (saveDisabled) return
              await onSubmit()
            }}
            disabled={saveDisabled}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
