"use client"

import { useState, useEffect, useCallback } from "react"
import type { Project, Pin } from "@/lib/types"
import { db } from "@/lib/db"
import { seedIfEmpty } from "@/lib/seed"
import { mapToUIProject } from "@/lib/mappers"
import { compressImageToJpeg } from "@/lib/utils/image"
import { enqueue, enqueuePhotoUpload, processOutbox } from "@/lib/outbox"

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await seedIfEmpty()
      const allProjects = await db.projects.toArray()
      // Map each project
      const uiProjects: Project[] = []
      for (const p of allProjects) {
        const floorplan = await db.floorplans.where('projectId').equals(p.id).first()
        if (!floorplan) continue
        const ui = await mapToUIProject(p, floorplan)
        uiProjects.push(ui)
      }
      if (mounted) {
        setProjects(uiProjects)
        setIsLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const syncAll = async () => {
    await processOutbox({ failRate: 0.15 })
    const allProjects = await db.projects.toArray()
    const uiProjects: Project[] = []
    for (const p of allProjects) {
      const floorplan = await db.floorplans.where('projectId').equals(p.id).first()
      if (!floorplan) continue
      const ui = await mapToUIProject(p, floorplan)
      uiProjects.push(ui)
    }
    setProjects(uiProjects)
  }

  return { projects, isLoading, syncAll }
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const p = await db.projects.get(projectId)
    if (!p) {
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
    const ui = await mapToUIProject(p, floorplan)
    setProject(ui)
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
    // Find floorplan for project
    const floorplan = await db.floorplans.where('projectId').equals(projectId).first()
    if (!floorplan) return
    const nowIso = new Date().toISOString()
    // Persist new pin
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
    // Update project updatedAt
    await db.projects.update(projectId, { updatedAt: nowIso })
    await load()
    console.log("[dexie] Added new pin to project:", newPin)
  }

  const addPhotos = async (pinId: string, files: File[]) => {
    // Enforce 4-photo limit
    const existingCount = await db.photos.where('pinId').equals(pinId).count()
    const remaining = Math.max(0, 4 - existingCount)
    const selected = Array.from(files).slice(0, remaining)
    for (const file of selected) {
      try {
        const c = await compressImageToJpeg(file, 1080, 0.75)
        const photoId = `${pinId}-ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        await db.photos.add({
          id: photoId,
          pinId,
          localUri: c.dataUrl,
          width: c.width,
          height: c.height,
          sizeBytes: c.sizeBytes,
          status: 'pending',
        })
        await enqueuePhotoUpload(photoId)
      } catch (e) {
        console.warn('[photos] compression failed', e)
      }
    }
    const nowIso = new Date().toISOString()
    await db.projects.update(projectId, { updatedAt: nowIso })
    await load()
  }

  const syncAll = async () => {
    await processOutbox({ failRate: 0.15 })
    await load()
  }

  return { project, isLoading, addPin, addPhotos, syncAll }
}
