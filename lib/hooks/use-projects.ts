"use client"

import { useEffect, useState, useCallback } from 'react'

import { db, type ProjectRow } from '@/lib/db'
import { ensureProjectFolderClient } from '@/lib/google'
import { enqueue, enqueuePhotoUpload } from '@/lib/outbox'
import { seedIfEmpty } from '@/lib/seed'
import { syncProject, type ProjectSyncSummary } from '@/lib/sync'
import type { Project, Pin } from '@/lib/types'
import { mapToUIProject } from '@/lib/mappers'
import { compressImageToJpeg } from '@/lib/utils/image'

export type CreateProjectParams = {
  name: string
  file: File
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function createProjectRecord({ name, file }: CreateProjectParams): Promise<{ projectId: string }> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('Project name is required')
  }
  const compressed = await compressImageToJpeg(file, 1080, 0.75)
  const nowIso = new Date().toISOString()
  const projectId = generateId('project')
  const floorplanId = generateId('floorplan')

  await db.transaction('rw', db.projects, db.floorplans, async () => {
    await db.projects.add({
      id: projectId,
      name: trimmedName,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    await db.floorplans.add({
      id: floorplanId,
      projectId,
      name: file.name || `${trimmedName} Floorplan`,
      type: 'image/jpeg',
      width: compressed.width,
      height: compressed.height,
      localUri: compressed.dataUrl,
    })
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
    const floorplan = await db.floorplans.where('projectId').equals(project.id).first()
    if (!floorplan) continue
    ui.push(await mapToUIProject(project, floorplan))
  }
  return ui
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ensureIssues, setEnsureIssues] = useState<EnsureIssue[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
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
        if (ensureRes.movedOrMissing) {
          issues.push({ projectId: projectRow.id, projectName: projectRow.name, driveFolderId: projectRow.driveFolderId })
        }
        if (ensureRes.projectFolderId && ensureRes.projectFolderId !== projectRow.driveFolderId) {
          await db.projects.update(projectRow.id, { driveFolderId: ensureRes.projectFolderId })
          folderId = ensureRes.projectFolderId
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
    if (res.projectFolderId && res.projectFolderId !== projectRow.driveFolderId) {
      await db.projects.update(projectId, { driveFolderId: res.projectFolderId })
    }
    setEnsureIssues((prev) => prev.filter((issue) => issue.projectId !== projectId))
    if (!folderId) {
      console.warn('[sync] missing Drive folder after re-create', projectId)
      setProjects(await mapProjectsToUI())
      return null
    }

    const floorplan = await db.floorplans.where('projectId').equals(projectId).first()
    if (floorplan) {
      await db.floorplans.update(floorplan.id, { driveFileId: undefined })
      const pins = await db.pins.where('floorplanId').equals(floorplan.id).toArray()
      const pinIds = pins.map((pin) => pin.id)
      if (pinIds.length) {
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

  const createProject = async (params: CreateProjectParams): Promise<string> => {
    const { projectId } = await createProjectRecord(params)
    setProjects(await mapProjectsToUI())
    return projectId
  }

  return { projects, isLoading, syncAll, ensureIssues, recreateProjectFolder, createProject }
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const row = await db.projects.get(projectId)
    if (!row) {
      setProject(null)
      setIsLoading(false)
      return
    }
    const floorplan = await db.floorplans.where('projectId').equals(projectId).first()
    if (!floorplan) {
      setProject(null)
      setIsLoading(false)
      return
    }
    setProject(await mapToUIProject(row, floorplan))
    setIsLoading(false)
  }, [projectId])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await seedIfEmpty()
      if (!mounted) return
      await load()
    })()
    return () => {
      mounted = false
    }
  }, [load])

  const addPin = async (newPin: Pin) => {
    const floorplan = await db.floorplans.where('projectId').equals(projectId).first()
    if (!floorplan) return
    const nowIso = new Date().toISOString()
    await db.pins.add({
      id: newPin.pinId,
      floorplanId: floorplan.id,
      title: newPin.title,
      note: newPin.note,
      xPct: newPin.xPct,
      yPct: newPin.yPct,
      updatedAt: nowIso,
    })
    await enqueue('create_pin', 'pin', newPin.pinId, { projectId })
    await db.projects.update(projectId, { updatedAt: nowIso })
    await load()
  }

  const addPhotos = async (pinId: string, files: File[]) => {
    const existingCount = await db.photos.where('pinId').equals(pinId).count()
    const remaining = Math.max(0, 4 - existingCount)
    const selected = Array.from(files).slice(0, remaining)
    for (const file of selected) {
      try {
        const compressed = await compressImageToJpeg(file, 1080, 0.75)
        const photoId = `${pinId}-ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        await db.photos.add({
          id: photoId,
          pinId,
          localUri: compressed.dataUrl,
          width: compressed.width,
          height: compressed.height,
          sizeBytes: compressed.sizeBytes,
          status: 'pending',
        })
        await enqueuePhotoUpload(photoId)
      } catch (error) {
        console.warn('[photos] compression failed', error)
      }
    }
    const nowIso = new Date().toISOString()
    await db.projects.update(projectId, { updatedAt: nowIso })
    await load()
  }

  const syncAll = async (): Promise<ProjectSyncSummary | null> => {
    const projectRow = await db.projects.get(projectId)
    if (!projectRow) return null
    const ensureRes = await ensureProjectFolderClient({
      projectId,
      projectName: projectRow.name,
      driveFolderId: projectRow.driveFolderId,
    })
    const folderId = ensureRes.projectFolderId ?? projectRow.driveFolderId
    if (!folderId) {
      throw new Error('Drive folder missing; run ensure first')
    }
    const summary = await syncProject(projectId, folderId)
    await load()
    return summary
  }

  return { project, isLoading, addPin, addPhotos, syncAll }
}

