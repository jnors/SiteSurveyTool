"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { db, type FloorplanRow, type ProjectRow } from '@/lib/db'
import { deletePhotoClient, ensureProjectFolderClient, validateProjectFolderClient, deleteProjectClient } from '@/lib/google'
import { enqueue, enqueuePhotoDriveDelete, enqueuePhotoUpload, removePhotoOutboxEntries } from '@/lib/outbox'
import { seedIfEmpty } from '@/lib/seed'
import { syncProject, type ProjectSyncSummary } from '@/lib/sync'
import type { DeletePhotoResult, Project, Pin } from '@/lib/types'
import { mapToUIProject } from '@/lib/mappers'
import { compressImageToJpeg } from '@/lib/utils/image'
import { ProjectSchema, FloorplanSchema, PhotoSchema } from '@/core'
import { MAX_PHOTO_RES, MAX_PHOTOS_PER_PIN } from '@/lib/constants'

export type CreateProjectParams = {
  name: string
  file: File
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

type UseFloorplansResult = {
  floorplans: FloorplanRow[]
  isLoading: boolean
  addFloorplan: (file: File) => Promise<{ floorplanId: string }>
  refresh: () => Promise<void>
}

export function useFloorplans(projectId: string): UseFloorplansResult {
  const [floorplans, setFloorplans] = useState<FloorplanRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const rows = await db.floorplans.where('projectId').equals(projectId).toArray()
    // Validate read rows at the boundary (non-throwing)
    rows.forEach((r) => {
      try {
        FloorplanSchema.parse(r)
      } catch { }
    })
    const ordered = rows.sort((a, b) => a.id.localeCompare(b.id))
    setFloorplans(ordered)
    setIsLoading(false)
  }, [projectId])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        await seedIfEmpty()
        if (!mounted) return
        await load()
      })()
    return () => {
      mounted = false
    }
  }, [load])

  const addFloorplan = useCallback(
    async (file: File): Promise<{ floorplanId: string }> => {
      const projectRow = await db.projects.get(projectId)
      if (!projectRow) {
        throw new Error('Project not found')
      }
      const compressed = await compressImageToJpeg(file, MAX_PHOTO_RES, 0.75)
      const floorplanId = generateId('floorplan')
      const fallbackName = `${projectRow.name} Floorplan ${floorplans.length + 1}`
      const name = file.name?.trim() || fallbackName
      const nowIso = new Date().toISOString()

      await db.transaction('rw', db.floorplans, db.projects, async () => {
        const floorplanDto = FloorplanSchema.parse({
          id: floorplanId,
          projectId,
          name,
          type: 'image/jpeg',
          width: compressed.width,
          height: compressed.height,
          localUri: compressed.dataUrl,
        })
        await db.floorplans.add(floorplanDto)
        await db.projects.update(projectId, { updatedAt: nowIso })
      })

      await load()
      return { floorplanId }
    },
    [floorplans.length, projectId, load],
  )

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  return { floorplans, isLoading, addFloorplan, refresh }
}

type UseActiveFloorplanResult = {
  activeFloorplanId: string | null
  setActiveFloorplanId: (floorplanId: string) => void
}

type FloorplanLike = { id: string }

export function useActiveFloorplan(floorplans: FloorplanLike[]): UseActiveFloorplanResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeFloorplanId, setActiveFloorplanId] = useState<string | null>(null)
  const searchParamsString = useMemo(() => searchParams.toString(), [searchParams])

  const ensureQueryParam = useCallback(
    (nextId: string | null) => {
      const params = new URLSearchParams(searchParamsString)
      if (nextId) {
        params.set('fp', nextId)
      } else {
        params.delete('fp')
      }
      const query = params.toString()
      const url = query ? `${pathname}?${query}` : pathname
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
      if (typeof window !== 'undefined' && isOffline) {
        window.history.replaceState(window.history.state, '', url)
      } else {
        router.replace(url, { scroll: false })
      }
    },
    [router, pathname, searchParamsString],
  )

  useEffect(() => {
    // When offline, we update URL via replaceState which doesn't update searchParams.
    // So we must read directly from window.location to get the true current state.
    const queryString = typeof window !== 'undefined' ? window.location.search : searchParamsString
    const params = new URLSearchParams(queryString)
    const param = params.get('fp')
    const hasParam = param && floorplans.some((fp) => fp.id === param)
    if (hasParam) {
      setActiveFloorplanId(param!)
      return
    }
    const fallback = floorplans[0]?.id ?? null
    setActiveFloorplanId(fallback)
    if (!param && fallback) {
      ensureQueryParam(fallback)
    }
  }, [searchParamsString, floorplans, ensureQueryParam])

  const handleSetActive = useCallback(
    (floorplanId: string) => {
      const exists = floorplans.some((fp) => fp.id === floorplanId)
      if (!exists) return

      // Always update local state immediately
      setActiveFloorplanId(floorplanId)

      // Try to update URL, but don't rely on it working offline
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
      if (!isOffline) {
        // Online: use normal router navigation
        ensureQueryParam(floorplanId)
      } else {
        // Offline: just update URL in address bar, state is already set
        const params = new URLSearchParams(window.location.search)
        params.set('fp', floorplanId)
        const url = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState(window.history.state, '', url)
      }
    },
    [floorplans, ensureQueryParam],
  )

  return { activeFloorplanId, setActiveFloorplanId: handleSetActive }
}

export async function createProjectRecord({ name, file }: CreateProjectParams): Promise<{ projectId: string }> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('Project name is required')
  }
  const compressed = await compressImageToJpeg(file, MAX_PHOTO_RES, 0.75)
  const nowIso = new Date().toISOString()
  const projectId = generateId('project')
  const floorplanId = generateId('floorplan')

  await db.transaction('rw', db.projects, db.floorplans, async () => {
    const projectDto = ProjectSchema.parse({
      id: projectId,
      name: trimmedName,
      createdAt: nowIso,
      updatedAt: nowIso,
      syncAnomaly: null,
    })
    const floorplanDto = FloorplanSchema.parse({
      id: floorplanId,
      projectId,
      name: file.name || `${trimmedName} Floorplan`,
      type: 'image/jpeg',
      width: compressed.width,
      height: compressed.height,
      localUri: compressed.dataUrl,
    })
    await db.projects.add(projectDto)
    await db.floorplans.add(floorplanDto)
  })

  return { projectId }
}

export type EnsureIssue = { projectId: string; projectName: string; driveFolderId?: string }
export type SyncResult = {
  ensured: number
  movedOrMissing: EnsureIssue[]
  errors: number
  projectSummaries: ProjectSyncSummary[]
}

async function mapProjectsToUI(): Promise<Project[]> {
  const rows = await db.projects.toArray()
  const ui: Project[] = []
  for (const project of rows) {
    try {
      ProjectSchema.parse(project)
    } catch { }
    const floorplans = await db.floorplans.where('projectId').equals(project.id).toArray()
    floorplans.forEach((fp) => {
      try {
        FloorplanSchema.parse(fp)
      } catch { }
    })
    if (!floorplans.length) continue
    const ordered = floorplans.sort((a, b) => a.id.localeCompare(b.id))
    ui.push(await mapToUIProject(project, ordered))
  }
  return ui
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ensureIssues, setEnsureIssues] = useState<EnsureIssue[]>([])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        await seedIfEmpty()
        if (!mounted) return
        setProjects(await mapProjectsToUI())
        setIsLoading(false)
      })()
    return () => {
      mounted = false
    }
  }, [])

  const syncAll = async (): Promise<SyncResult> => {
    setProjects((prev) => prev.map((p) => ({ ...p, status: 'syncing' as const })))

    const issues: EnsureIssue[] = []
    const summaries: ProjectSyncSummary[] = []
    let ensuredCount = 0
    let errorCount = 0

    const projectRows = await db.projects.toArray()

    for (const projectRow of projectRows) {
      let folderId: string | undefined = projectRow.driveFolderId
      try {
        console.log('[syncAll] ensuring project', projectRow.id, 'current folder', projectRow.driveFolderId)
        const ensureRes = await ensureProjectFolderClient({
          projectId: projectRow.id,
          projectName: projectRow.name,
          driveFolderId: projectRow.driveFolderId,
        })
        ensuredCount += 1
        const ensureAnomaly = ensureRes.movedOrMissing ? ensureRes.anomaly ?? 'missing' : null

        if (ensureRes.movedOrMissing) {
          issues.push({ projectId: projectRow.id, projectName: projectRow.name, driveFolderId: projectRow.driveFolderId })
          if (projectRow.syncAnomaly !== ensureAnomaly) {
            await db.projects.update(projectRow.id, { syncAnomaly: ensureAnomaly })
            projectRow.syncAnomaly = ensureAnomaly ?? null
          }
        } else if (projectRow.syncAnomaly) {
          await db.projects.update(projectRow.id, { syncAnomaly: null })
          projectRow.syncAnomaly = null
        }
        if (ensureRes.projectFolderId && ensureRes.projectFolderId !== projectRow.driveFolderId) {
          await db.projects.update(projectRow.id, { driveFolderId: ensureRes.projectFolderId })
          folderId = ensureRes.projectFolderId
          projectRow.driveFolderId = ensureRes.projectFolderId
        } else {
          folderId = ensureRes.projectFolderId ?? projectRow.driveFolderId
        }
      } catch (error) {
        errorCount += 1
        console.warn('[drive] ensure failed', projectRow.id, error)
        continue
      }

      if (!folderId) {
        errorCount += 1
        console.warn('[sync] missing Drive folder id for project', projectRow.id)
        continue
      }

      try {
        const summary = await syncProject(projectRow.id, folderId)
        summaries.push(summary)
        console.log('[syncAll] summary', projectRow.id, summary)
        if (summary.errors.length) {
          errorCount += summary.errors.length
        }
      } catch (error) {
        errorCount += 1
        console.warn('[sync] project sync failed', projectRow.id, error)
      }
    }

    setProjects(await mapProjectsToUI())
    setEnsureIssues(issues)

    return { ensured: ensuredCount, movedOrMissing: issues, errors: errorCount, projectSummaries: summaries }
  }

  const recreateProjectFolder = async (projectId: string): Promise<ProjectSyncSummary | null> => {
    const projectRow = (await db.projects.get(projectId)) as ProjectRow | undefined
    if (!projectRow) return null
    const res = await ensureProjectFolderClient({ projectId: projectRow.id, projectName: projectRow.name })
    const folderId = res.projectFolderId ?? projectRow.driveFolderId
    const updates: Partial<ProjectRow> = {}
    if (res.projectFolderId && res.projectFolderId !== projectRow.driveFolderId) {
      updates.driveFolderId = res.projectFolderId
      projectRow.driveFolderId = res.projectFolderId
    }
    if (projectRow.syncAnomaly) {
      updates.syncAnomaly = null
      projectRow.syncAnomaly = null
    }
    if (Object.keys(updates).length) {
      await db.projects.update(projectId, updates)
    }
    setEnsureIssues((prev) => prev.filter((issue) => issue.projectId !== projectId))
    if (!folderId) {
      console.warn('[sync] missing Drive folder after re-create', projectId)
      setProjects(await mapProjectsToUI())
      return null
    }

    const floorplans = await db.floorplans.where('projectId').equals(projectId).toArray()
    for (const floorplan of floorplans) {
      await db.floorplans.update(floorplan.id, { driveFileId: undefined })
      const pins = await db.pins.where('floorplanId').equals(floorplan.id).toArray()
      const pinIds = pins.map((pin) => pin.id)
      if (!pinIds.length) continue
      const photos = await db.photos.where('pinId').anyOf(pinIds).toArray()
      for (const photo of photos) {
        await db.photos.update(photo.id, { driveFileId: undefined, status: 'pending' })
        const existing = await db.outbox
          .where('entityType')
          .equals('photo')
          .and((row) => row.entityId === photo.id)
          .first()
        if (!existing) {
          await enqueuePhotoUpload(photo.id)
        }
      }
    }

    let summary: ProjectSyncSummary | null = null
    try {
      summary = await syncProject(projectId, folderId)
      console.log('[recreate] summary', projectId, summary)
    } catch (error) {
      console.warn('[sync] project sync failed during re-create', projectId, error)
    }
    setProjects(await mapProjectsToUI())
    return summary
  }

  const relinkProjectFolder = async (projectId: string, folderInput: string): Promise<string | null> => {
    const projectRow = (await db.projects.get(projectId)) as ProjectRow | undefined
    if (!projectRow) {
      throw new Error('Project not found locally.')
    }
    const { folderId } = await validateProjectFolderClient({
      projectId: projectRow.id,
      projectName: projectRow.name,
      folderInput,
    })

    const ensureRes = await ensureProjectFolderClient({
      projectId: projectRow.id,
      projectName: projectRow.name,
      driveFolderId: folderId,
    })

    if (ensureRes.movedOrMissing) {
      throw new Error('Drive still reports this folder as moved or missing.')
    }

    const resolvedFolderId = ensureRes.projectFolderId ?? folderId
    const nowIso = new Date().toISOString()
    await db.projects.update(projectId, {
      driveFolderId: resolvedFolderId,
      updatedAt: nowIso,
      syncAnomaly: null,
    })
    projectRow.syncAnomaly = null
    setEnsureIssues((prev) => prev.filter((issue) => issue.projectId !== projectId))
    setProjects(await mapProjectsToUI())
    return resolvedFolderId
  }

  const createProject = async (params: CreateProjectParams): Promise<string> => {
    const { projectId } = await createProjectRecord(params)
    setProjects(await mapProjectsToUI())
    return projectId
  }

  const deleteProject = async (projectId: string): Promise<void> => {
    const projectRow = await db.projects.get(projectId)
    if (!projectRow) return

    // 1. Delete from Drive (if online)
    if (projectRow.driveFolderId && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await deleteProjectClient({ driveFolderId: projectRow.driveFolderId })
      } catch (error) {
        console.warn('[deleteProject] drive delete failed', error)
        // Continue with local delete even if Drive fails
      }
    }

    // 2. Cascade delete local data
    await db.transaction('rw', [db.projects, db.floorplans, db.pins, db.photos, db.outbox], async () => {
      // Find all related IDs
      const floorplans = await db.floorplans.where('projectId').equals(projectId).toArray()
      const floorplanIds = floorplans.map((fp) => fp.id)
      const pins = await db.pins.where('floorplanId').anyOf(floorplanIds).toArray()
      const pinIds = pins.map((p) => p.id)
      const photos = await db.photos.where('pinId').anyOf(pinIds).toArray()
      const photoIds = photos.map((p) => p.id)

      // Delete Photos
      await db.photos.bulkDelete(photoIds)

      // Delete Pins
      await db.pins.bulkDelete(pinIds)

      // Delete Floorplans
      await db.floorplans.bulkDelete(floorplanIds)

      // Delete Project
      await db.projects.delete(projectId)

      // Clean up outbox
      // Note: We might want to keep delete ops if we want to sync deletes later, 
      // but for now we just clear related outbox items to stop syncing.
      const outboxIds = await db.outbox
        .where('entityId')
        .anyOf([...photoIds, ...pinIds, projectId])
        .primaryKeys()
      await db.outbox.bulkDelete(outboxIds)
    })

    setProjects(await mapProjectsToUI())
  }

  const refresh = useCallback(async () => {
    setProjects(await mapProjectsToUI())
  }, [])

  return { projects, isLoading, syncAll, ensureIssues, recreateProjectFolder, relinkProjectFolder, createProject, deleteProject, refresh }
}

export function useProject(projectId: string, preferredFloorplanId: string | null) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    await seedIfEmpty()
    const row = await db.projects.get(projectId)
    if (!row) {
      setProject(null)
      setIsLoading(false)
      return
    }

    const floorplans = await db.floorplans.where('projectId').equals(projectId).toArray()
    const ordered = floorplans.sort((a, b) => a.id.localeCompare(b.id))

    const resolvedFloorplanId =
      preferredFloorplanId && ordered.some((fp) => fp.id === preferredFloorplanId)
        ? preferredFloorplanId
        : ordered[0]?.id ?? null

    const mapped = await mapToUIProject(row, ordered, { activeFloorplanId: resolvedFloorplanId })
    setProject(mapped)
    setIsLoading(false)
  }, [projectId, preferredFloorplanId])

  useEffect(() => {
    setIsLoading(true)
    void load()
  }, [load])

  const addFloorplan = useCallback(
    async (file: File): Promise<{ floorplanId: string }> => {
      const projectRow = await db.projects.get(projectId)
      if (!projectRow) {
        throw new Error('Project not found')
      }
      const compressed = await compressImageToJpeg(file, MAX_PHOTO_RES, 0.75)
      const floorplanId = generateId('floorplan')
      const fallbackName = `${projectRow.name} Floorplan ${(project?.floorplans.length ?? 0) + 1}`
      const name = file.name?.trim() || fallbackName
      const nowIso = new Date().toISOString()

      await db.transaction('rw', db.floorplans, db.projects, async () => {
        await db.floorplans.add({
          id: floorplanId,
          projectId,
          name,
          type: 'image/jpeg',
          width: compressed.width,
          height: compressed.height,
          localUri: compressed.dataUrl,
        })
        await db.projects.update(projectId, { updatedAt: nowIso })
      })

      await load()
      return { floorplanId }
    },
    [projectId, project?.floorplans.length, load],
  )

  const addPin = useCallback(
    async (newPin: Pin) => {
      const targetFloorplanId = project?.activeFloorplanId ?? null
      if (!targetFloorplanId) return
      const nowIso = new Date().toISOString()
      await db.pins.add({
        id: newPin.pinId,
        floorplanId: targetFloorplanId,
        title: newPin.title,
        note: newPin.note,
        xPct: newPin.xPct,
        yPct: newPin.yPct,
        updatedAt: nowIso,
      })
      await enqueue('create_pin', 'pin', newPin.pinId, { projectId })
      await db.projects.update(projectId, { updatedAt: nowIso })
      await load()
    },
    [project?.activeFloorplanId, projectId, load],
  )

  const addPhotos = useCallback(
    async (pinId: string, files: File[]) => {
      const existingCount = await db.photos.where('pinId').equals(pinId).count()
      const remaining = Math.max(0, MAX_PHOTOS_PER_PIN - existingCount)
      const selected = Array.from(files).slice(0, remaining)
      for (const file of selected) {
        try {
          const compressed = await compressImageToJpeg(file, MAX_PHOTO_RES, 0.75)
          const photoId = `${pinId}-ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const photoDto = PhotoSchema.parse({
            id: photoId,
            pinId,
            localUri: compressed.dataUrl,
            width: compressed.width,
            height: compressed.height,
            sizeBytes: compressed.sizeBytes,
            status: 'pending',
          })
          await db.photos.add(photoDto)
          await enqueuePhotoUpload(photoId)
        } catch (error) {
          console.warn('[photos] compression failed', error)
        }
      }
      const nowIso = new Date().toISOString()
      await db.projects.update(projectId, { updatedAt: nowIso })
      await load()
    },
    [projectId, load],
  )

  const deletePhoto = useCallback(
    async (photoId: string) => {
      const result = await deletePhotoRecord(projectId, photoId)
      if (result.deleted) {
        await load()
      }
      return result
    },
    [projectId, load],
  )

  const deletePin = useCallback(
    async (pinId: string) => {
      // Get all photos for this pin
      const photos = await db.photos.where('pinId').equals(pinId).toArray()
      const photoIds = photos.map((p) => p.id)

      await db.transaction('rw', [db.pins, db.photos, db.outbox, db.projects], async () => {
        // Delete all photos
        if (photoIds.length > 0) {
          await db.photos.bulkDelete(photoIds)
        }

        // Delete the pin
        await db.pins.delete(pinId)

        // Clean up related outbox entries (uploads, etc.)
        const outboxIds = await db.outbox
          .where('entityId')
          .anyOf([...photoIds, pinId])
          .primaryKeys()
        if (outboxIds.length > 0) {
          await db.outbox.bulkDelete(outboxIds)
        }

        // Add outbox entry to trigger project.json sync (which will exclude the deleted pin)
        await enqueue('update_pin', 'pin', pinId, { projectId, deleted: true })

        // Update project timestamp
        const nowIso = new Date().toISOString()
        await db.projects.update(projectId, { updatedAt: nowIso })
      })

      await load()
    },
    [projectId, load],
  )

  const syncAll = useCallback(async (onProgress?: (message: string) => void): Promise<ProjectSyncSummary | null> => {
    const projectRow = await db.projects.get(projectId)
    if (!projectRow) return null
    onProgress?.('Ensuring Drive folder...')
    const ensureRes = await ensureProjectFolderClient({
      projectId,
      projectName: projectRow.name,
      driveFolderId: projectRow.driveFolderId,
    })
    const folderId = ensureRes.projectFolderId ?? projectRow.driveFolderId
    if (!folderId) {
      throw new Error('Drive folder missing; run ensure first')
    }
    const summary = await syncProject(projectId, folderId, {
      floorplanId: project?.activeFloorplanId ?? undefined,
      onProgress,
    })
    await load()
    return summary
  }, [projectId, project?.activeFloorplanId, load])

  return {
    project,
    isLoading,
    activeFloorplanId: project?.activeFloorplanId ?? null,
    addPin,
    addPhotos,
    deletePhoto,
    deletePin,
    addFloorplan,
    syncAll,
  }
}

export async function deletePhotoRecord(projectId: string, photoId: string): Promise<DeletePhotoResult> {
  const photo = await db.photos.get(photoId)
  if (!photo) {
    return { deleted: false, driveDeleted: false, drivePending: false }
  }
  const nowIso = new Date().toISOString()
  const driveFileId = photo.driveFileId
  let driveDeleted = false
  let driveError: string | undefined

  if (driveFileId) {
    try {
      await deletePhotoClient({ driveFileId })
      driveDeleted = true
    } catch (error: any) {
      driveError = error instanceof Error ? error.message : 'Drive delete failed'
    }
  }

  let enqueueDriveDelete = false

  await db.transaction('rw', db.photos, db.outbox, db.pins, db.projects, async () => {
    await db.photos.delete(photoId)
    await removePhotoOutboxEntries(photoId)
    await db.pins.update(photo.pinId, { updatedAt: nowIso })
    await db.projects.update(projectId, { updatedAt: nowIso })
    if (driveFileId && !driveDeleted) {
      enqueueDriveDelete = true
    }
  })

  if (enqueueDriveDelete && driveFileId) {
    await enqueuePhotoDriveDelete(photoId, driveFileId)
  }

  return {
    deleted: true,
    driveDeleted,
    drivePending: enqueueDriveDelete,
    driveError,
  }
}
