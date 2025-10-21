"use client"

import { useState, useEffect } from "react"
import type { Project, Pin } from "@/lib/types"
import { fakeProjects } from "@/lib/fake-data"

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProjects(fakeProjects)
      setIsLoading(false)
    }, 500)
  }, [])

  return { projects, isLoading }
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const found = fakeProjects.find((p) => p.projectId === projectId)
      setProject(found || null)
      setIsLoading(false)
    }, 300)
  }, [projectId])

  const addPin = (newPin: Pin) => {
    if (project) {
      const updatedProject = {
        ...project,
        pins: [...project.pins, newPin],
      }
      setProject(updatedProject)
      console.log("[v0] Added new pin to project:", newPin)
      // TODO: Persist to Dexie/backend
    }
  }

  return { project, isLoading, addPin }
}
