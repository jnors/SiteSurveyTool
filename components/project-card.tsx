import Link from "next/link"
import type { Project } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { getSyncStatusTextColor } from "@/lib/utils/sync-status"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
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

  return (
    <Link href={`/projects/${project.projectId}`}>
      <Card className="group cursor-pointer border-border bg-background-card p-6 transition-colors hover:border-border-hover hover:bg-background-hover">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-foreground text-lg">{project.name}</h3>
            <p className="text-foreground-muted text-sm">Last synced: {formatDate(project.lastSynced)}</p>
            <p className="mt-1 text-foreground-subtle text-xs">
              {project.pins.length} pin{project.pins.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className={`flex items-center gap-2 ${getSyncStatusTextColor(project.status)}`}>{getStatusIcon()}</div>
        </div>
      </Card>
    </Link>
  )
}
