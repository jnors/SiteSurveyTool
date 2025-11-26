import { useState } from 'react'
import type { ProjectSyncSummary } from '@/lib/sync'

// Define the shape of the issue object
export type SyncIssue = {
    projectId: string
    projectName: string
    // Add other properties as needed based on what `movedOrMissing` returns
}

interface UseProjectSyncProps {
    syncAll: () => Promise<{
        movedOrMissing: SyncIssue[]
        projectSummaries: ProjectSyncSummary[]
        errors: number
    }>
    recreateProjectFolder: (projectId: string) => Promise<ProjectSyncSummary | null>
    relinkProjectFolder: (projectId: string, folderUrlOrId: string) => Promise<void>
    onToast: (message: string) => void
}

export function useProjectSync({
    syncAll,
    recreateProjectFolder,
    relinkProjectFolder,
    onToast,
}: UseProjectSyncProps) {
    const [issues, setIssues] = useState<SyncIssue[]>([])
    const [issuesOpen, setIssuesOpen] = useState(false)
    const [relinkTarget, setRelinkTarget] = useState<SyncIssue | null>(null)
    const [relinkInput, setRelinkInput] = useState('')
    const [relinkError, setRelinkError] = useState<string | null>(null)
    const [isRelinking, setIsRelinking] = useState(false)

    const buildSummaryMessage = (result: any) => {
        const totalProjects = result.projectSummaries.length
        const totalPhotos = result.projectSummaries.reduce((sum: any, summary: any) => sum + summary.photoStats.total, 0)
        const uploadedPhotos = result.projectSummaries.reduce((sum: any, summary: any) => sum + summary.photoStats.success, 0)
        const failedPhotos = result.projectSummaries.reduce((sum: any, summary: any) => sum + summary.photoStats.failed, 0)
        const jsonCount = result.projectSummaries.filter((summary: any) => summary.projectJsonWritten).length

        const parts: string[] = []
        if (totalPhotos > 0) {
            parts.push(`${uploadedPhotos}/${totalPhotos} photos`)
        }
        if (failedPhotos > 0) {
            parts.push(`${failedPhotos} failed`)
        }
        parts.push(`${jsonCount} project.json`)

        const base = `Synced ${totalProjects} project${totalProjects === 1 ? '' : 's'}`
        const detail = parts.length ? `: ${parts.join(' | ')}` : ''
        const errors = result.errors > 0 ? ` (${result.errors} error${result.errors === 1 ? '' : 's'})` : ''
        return `${base}${detail}${errors}`
    }

    const buildSummaryFromProjects = (summaries: any[]): string => {
        const errors = summaries.reduce((sum, summary) => sum + summary.errors.length, 0)
        return buildSummaryMessage({
            ensured: summaries.length,
            movedOrMissing: [],
            errors,
            projectSummaries: summaries,
        })
    }

    const handleSyncAll = async () => {
        const result = await syncAll()
        if (result.movedOrMissing.length) {
            setIssues(result.movedOrMissing)
            setIssuesOpen(true)
        } else {
            setIssues([])
        }
        onToast(buildSummaryMessage(result))
    }

    const handleRecreate = async () => {
        const summaries: any[] = []
        for (const issue of issues) {
            const summary = await recreateProjectFolder(issue.projectId)
            if (summary) summaries.push(summary)
        }
        setIssues([])
        setIssuesOpen(false)
        const toastMessage = summaries.length
            ? buildSummaryFromProjects(summaries)
            : 'Re-created Drive folder(s).'
        onToast(toastMessage)
    }

    const handleRelink = async () => {
        if (!relinkTarget) return
        try {
            setIsRelinking(true)
            setRelinkError(null)
            await relinkProjectFolder(relinkTarget.projectId, relinkInput)
            setIssues((prev) => {
                const next = prev.filter((issue) => issue.projectId !== relinkTarget.projectId)
                if (!next.length) {
                    setIssuesOpen(false)
                }
                return next
            })
            onToast('Drive folder relinked. Ready to sync.')
            setRelinkTarget(null)
            setRelinkInput('')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to relink folder.'
            setRelinkError(message)
        } finally {
            setIsRelinking(false)
        }
    }

    const openRelinkDialog = (issue: SyncIssue) => {
        setRelinkTarget(issue)
        setRelinkInput('')
        setRelinkError(null)
    }

    const closeRelinkDialog = () => {
        setRelinkTarget(null)
        setRelinkInput('')
        setRelinkError(null)
        setIsRelinking(false)
    }

    return {
        issues,
        issuesOpen,
        setIssuesOpen,
        relinkTarget,
        relinkInput,
        setRelinkInput,
        relinkError,
        isRelinking,
        handleSyncAll,
        handleRecreate,
        handleRelink,
        openRelinkDialog,
        closeRelinkDialog,
    }
}
