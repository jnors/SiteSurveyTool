import { Loader2 } from '@/ui'
import type { RestoreProgress } from '@/lib/restore'

interface RestoreProgressOverlayProps {
    isRestoring: boolean
    progress: RestoreProgress | null
}

export function RestoreProgressOverlay({ isRestoring, progress }: RestoreProgressOverlayProps) {
    if (!isRestoring || !progress) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold">Restoring from Drive...</h2>
                <p className="mb-4 text-sm text-foreground-muted">{progress.message}</p>
                {progress.projectsTotal > 0 && (
                    <>
                        <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                    width: `${(progress.projectsCompleted / progress.projectsTotal) * 100}%`,
                                }}
                            />
                        </div>
                        <p className="text-center text-sm text-foreground-muted">
                            {progress.projectsCompleted} of {progress.projectsTotal} projects
                        </p>
                    </>
                )}
                {progress.phase === 'discovering' && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>
        </div>
    )
}
