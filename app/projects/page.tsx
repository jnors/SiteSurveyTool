"use client"

import { useProjects } from "@/lib/hooks/use-projects"
import { NavBar } from "@/components/nav-bar"
import { SyncBanner } from "@/components/sync-banner"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import type { SyncStatus } from "@/lib/types"

export default function ProjectsPage() {
  const { projects, isLoading, syncAll } = useProjects()

  // Calculate overall sync status
  const getOverallStatus = (): SyncStatus => {
    if (projects.some((p) => p.status === "error")) return "error"
    if (projects.some((p) => p.status === "syncing")) return "syncing"
    if (projects.some((p) => p.status === "pending")) return "pending"
    return "synced"
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <SyncBanner status={getOverallStatus()} onSync={syncAll} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-bold text-3xl text-foreground">Projects</h1>
            <p className="text-foreground-muted">Manage your site survey projects</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
