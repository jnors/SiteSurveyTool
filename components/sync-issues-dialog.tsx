import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Button } from '@/ui'
import { DRIVE_ROOT_NAME } from '@/core'
import type { SyncIssue } from '@/hooks/useProjectSync'

interface SyncIssuesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    issues: SyncIssue[]
    onRelink: (issue: SyncIssue) => void
    onRecreate: () => void
}

export function SyncIssuesDialog({
    open,
    onOpenChange,
    issues,
    onRelink,
    onRecreate,
}: SyncIssuesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Drive folder moved or missing</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-sm text-foreground">
                    <p>We couldn't find the linked Drive folder for:</p>
                    <ul className="space-y-2">
                        {issues.map((issue) => (
                            <li
                                key={issue.projectId}
                                className="flex flex-col gap-2 rounded-md border border-border bg-background-card px-3 py-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm">
                                        <p className="font-medium text-foreground">{issue.projectName}</p>
                                        <p className="text-xs text-foreground-muted">{issue.projectId}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRelink(issue)}
                                    >
                                        Relink
                                    </Button>
                                </div>
                                <p className="text-xs text-foreground-muted">
                                    Expected folder name:{' '}
                                    <code className="rounded bg-muted px-1 py-0.5">
                                        {`${issue.projectName}__${issue.projectId}`}
                                    </code>
                                </p>
                            </li>
                        ))}
                    </ul>
                    <p className="text-foreground-muted">You can re-create the folder under /My Drive/{DRIVE_ROOT_NAME}/ now or do it later.</p>
                </div>
                <DialogFooter className="gap-2">
                    <Button onClick={onRecreate}>
                        Re-create here
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
