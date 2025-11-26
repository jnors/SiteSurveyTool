import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Button, Input, Loader2 } from '@/ui'
import { DRIVE_ROOT_NAME } from '@/core'
import type { SyncIssue } from '@/hooks/useProjectSync'

interface RelinkDialogProps {
    target: SyncIssue | null
    open: boolean
    onOpenChange: (open: boolean) => void
    inputValue: string
    onInputChange: (value: string) => void
    error: string | null
    isRelinking: boolean
    onSave: () => void
    onCancel: () => void
}

export function RelinkDialog({
    target,
    open,
    onOpenChange,
    inputValue,
    onInputChange,
    error,
    isRelinking,
    onSave,
    onCancel,
}: RelinkDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Relink Drive folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-foreground">
                    {target && (
                        <p className="text-foreground-muted">
                            Paste the Drive folder link or ID for <span className="text-foreground">{target.projectName}</span>.
                            The folder must live under <code className="rounded bg-muted px-1 py-0.5">/My Drive/{DRIVE_ROOT_NAME}/</code> and match&nbsp;
                            <code className="rounded bg-muted px-1 py-0.5">
                                {`${target.projectName}__${target.projectId}`}
                            </code>
                            .
                        </p>
                    )}
                    <Input
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={inputValue}
                        onChange={(event) => onInputChange(event.target.value)}
                        aria-invalid={Boolean(error)}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isRelinking}
                    >
                        {isRelinking ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Relinking...
                            </span>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
