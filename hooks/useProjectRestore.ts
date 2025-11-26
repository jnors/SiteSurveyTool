import { useState, useEffect } from 'react'
import { restoreFromDrive, type RestoreProgress } from '@/lib/restore'

interface UseProjectRestoreProps {
    isAuthenticated: boolean
    isLoading: boolean
    projectCount: number
    isOnline: boolean
    refresh: () => Promise<void>
    onToast: (message: string) => void
}

export function useProjectRestore({
    isAuthenticated,
    isLoading,
    projectCount,
    isOnline,
    refresh,
    onToast,
}: UseProjectRestoreProps) {
    const [isRestoring, setIsRestoring] = useState(false)
    const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null)
    const [hasTriggeredRestore, setHasTriggeredRestore] = useState(false)

    const handleAutoRestore = async () => {
        setIsRestoring(true)
        try {
            const result = await restoreFromDrive((progress) => {
                setRestoreProgress(progress)
            })

            if (result.errors.length > 0) {
                onToast(`Restored ${result.projectsRestored} projects with ${result.errors.length} errors`)
            } else if (result.projectsRestored > 0) {
                onToast(`Restored ${result.projectsRestored} projects from Drive`)
            }
        } catch (error) {
            console.error('[projects] Auto-restore failed:', error)
            onToast('Failed to restore projects from Drive')
        } finally {
            setIsRestoring(false)
            setRestoreProgress(null)
            await refresh()
        }
    }

    // Auto-restore from Drive when authenticated + empty DB
    useEffect(() => {
        if (
            isAuthenticated &&
            !isLoading &&
            projectCount === 0 &&
            isOnline &&
            !hasTriggeredRestore &&
            !isRestoring
        ) {
            setHasTriggeredRestore(true)
            handleAutoRestore()
        }
    }, [isAuthenticated, isLoading, projectCount, isOnline, hasTriggeredRestore, isRestoring])

    return {
        isRestoring,
        restoreProgress,
    }
}
