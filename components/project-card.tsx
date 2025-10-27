import Link from "next/link"
import type { Project } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { getSyncStatusTextColor } from "@/lib/utils/sync-status"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"

interface ProjectCardProps {
  project: Project
  movedOrMissing?: boolean
}

export function ProjectCard({ project, movedOrMissing = false }: ProjectCardProps) {
  const getStatusIcon = () => {
    switch (project.status) {
      case "synced":
        return <CheckCircle2 className="h-5 w-5" />
      case "pending":
        return <Clock className="h-5 w-5" />
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "syncing":
        return <Loader2 className="h-5 w-5 animate-spin" />
    }
  }

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

  const totalPins = project.floorplans.reduce((sum, floorplan) => sum + floorplan.pinCount, 0)

  return (
    <Link href={`/projects/${project.projectId}`} prefetch>
      <Card className="group cursor-pointer border-border bg-background-card p-6 transition-colors hover:border-border-hover hover:bg-background-hover">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-foreground text-lg">{project.name}</h3>
            <p className="text-foreground-muted text-sm">Last synced: {formatDate(project.lastSynced)}</p>
            <p className="mt-1 text-foreground-subtle text-xs">
              {totalPins} pin{totalPins !== 1 ? "s" : ""} · {project.floorplans.length} floorplan
              {project.floorplans.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className={`flex items-center gap-2 ${getSyncStatusTextColor(project.status)}`}>
            {getStatusIcon()}
            {movedOrMissing && (
              <span className="rounded-full border border-yellow-500 bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                Relink
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
