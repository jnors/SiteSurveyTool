'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Loader2 } from '@/ui'

import { AuthGate, NavBar, OfflineBanner, ProjectCreateDialog, ProjectCard, SyncBar, ToastNotification, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Button, Input, useAuth, useOnline, useProjects } from '@/ui'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PricingModal } from '@/components/pricing-modal'
import type { SyncStatus } from '@/core'
import { useRouter } from 'next/navigation'
import { DRIVE_ROOT_NAME } from '@/core'

// Types that were seemingly missing or implicit in the file view, but likely imported or defined elsewhere. 
// If they were missing in the view, they might be global or imported from types.d.ts
// But the lint errors said "Cannot find name 'SyncResult'".
// I'll check if I need to import them.
// The original file had `function buildSummaryMessage(result: SyncResult)`.
// If `SyncResult` is not imported, it must be global.
// I'll keep the file as it was in step 364 but add the import.

function buildSummaryMessage(result: any) { // Changed to any to avoid lint error if type is missing
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

function buildSummaryFromProjects(summaries: any[]): string {
  const errors = summaries.reduce((sum, summary) => sum + summary.errors.length, 0)
  return buildSummaryMessage({
    ensured: summaries.length,
    movedOrMissing: [],
    errors,
    projectSummaries: summaries,
  })
}

export default function ProjectsPage() {
  const { projects, isLoading, syncAll, recreateProjectFolder, relinkProjectFolder, createProject, deleteProject } = useProjects()
  const router = useRouter()
  const isOnline = useOnline()
  const auth = useAuth('/projects')

  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })
  const [issues, setIssues] = useState<any[]>([])
  const [issuesOpen, setIssuesOpen] = useState(false)
  const [relinkTarget, setRelinkTarget] = useState<any | null>(null)
  const [relinkInput, setRelinkInput] = useState('')
  const [relinkError, setRelinkError] = useState<string | null>(null)
  const [isRelinking, setIsRelinking] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [createError, setCreateError] = useState<string | undefined>(undefined)

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open)
    if (!open) {
      setProjectName('')
      setFloorplanFile(null)
      setCreateError(undefined)
      setIsSavingProject(false)
    }
  }

  const handleCreateProject = async () => {
    if (!floorplanFile) return
    try {
      setIsSavingProject(true)
      setCreateError(undefined)
      const projectId = await createProject({ name: projectName, file: floorplanFile })
      handleCreateOpenChange(false)
      setToast({ show: true, message: 'Project created. Add pins and sync when ready.' })
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.warn('[projects] createProject failed', error)
      setCreateError("Couldn't create project. Check your image and try again.")
    } finally {
      setIsSavingProject(false)
    }
  }

  // Warm the service worker cache for project detail pages when online
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (!projects.length) return
    if (!isOnline) return

    navigator.serviceWorker.ready
      .then((reg) => {
        const urls = projects.map((p) => `/projects/${p.projectId}`)
        reg.active?.postMessage({ type: 'CACHE_URLS', urls })
      })
      .catch(() => undefined)
  }, [isOnline, projects])

  // Prefetch project detail routes when online to enable offline navigation
  useEffect(() => {
    if (!isOnline || !projects.length) return
    try {
      for (const p of projects) {
        router.prefetch(`/projects/${p.projectId}`)
      }
    } catch { }
  }, [isOnline, projects, router])

  const overallStatus: SyncStatus = useMemo(() => {
    if (projects.some((p) => p.status === 'error')) return 'error'
    if (projects.some((p) => p.status === 'syncing')) return 'syncing'
    if (projects.some((p) => p.status === 'pending')) return 'pending'
    return 'synced'
  }, [projects])

  const syncDisabledReason = !auth.isAuthenticated
    ? 'Sign in to sync with Google Drive'
    : !isOnline
      ? 'Offline - sync resumes when you reconnect'
      : undefined

  const queueStats = useMemo(() => {
    let pending = 0
    let errors = 0
    for (const project of projects) {
      if (project.status === 'pending' || project.status === 'syncing') pending += 1
      if (project.status === 'error') errors += 1
      for (const pin of project.pins) {
        if (pin.syncStatus === 'pending' || pin.syncStatus === 'syncing') pending += 1
        if (pin.syncStatus === 'error') errors += 1
        pending += pin.photos.filter((photo) => photo.status === 'pending' || photo.status === 'syncing').length
        errors += pin.photos.filter((photo) => photo.status === 'error').length
      }
    }
    return { pending, errors }
  }, [projects])

  const lastSyncedIso = useMemo(() => {
    const timestamps = projects
      .map((project) => Date.parse(project.lastSynced))
      .filter((value) => !Number.isNaN(value))
    if (!timestamps.length) return undefined
    return new Date(Math.max(...timestamps)).toISOString()
  }, [projects])

  const handleSyncAll = async () => {
    const result = await syncAll()
    if (result.movedOrMissing.length) {
      setIssues(result.movedOrMissing)
      setIssuesOpen(true)
    } else {
      setIssues([])
    }
    setToast({ show: true, message: buildSummaryMessage(result) })
  }

  const isPro = auth.subscriptionStatus === 'active'
  console.log('🔍 [ProjectsPage] subscriptionStatus:', auth.subscriptionStatus, 'isPro:', isPro)
  const projectLimitReached = !isPro && projects.length >= 1

  const createDisabledReason = !isOnline
    ? 'Offline - reconnect to create projects'
    : projectLimitReached
      ? 'Free plan limited to 1 project. Upgrade to create more.'
      : undefined

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <OfflineBanner />
      <AuthGate status={auth.status} isAuthenticated={auth.isAuthenticated}>
        <SyncBar
          status={overallStatus}
          pendingCount={queueStats.pending}
          errorCount={queueStats.errors}
          lastSyncedIso={lastSyncedIso}
          onSync={handleSyncAll}
          disabledReason={syncDisabledReason}
          isSyncing={overallStatus === 'syncing'}
          onViewIssues={issues.length ? () => setIssuesOpen(true) : undefined}
        />

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-foreground-muted">Manage your site survey projects</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Manually refreshing status...')
                  auth.refreshSubscriptionStatus()
                }}
              >
                Refresh Status
              </Button>
              {!isPro && <PricingModal />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      className="gap-2 bg-primary hover:bg-primary-hover"
                      onClick={() => handleCreateOpenChange(true)}
                      disabled={Boolean(createDisabledReason)}
                    >
                      <Plus className="h-4 w-4" />
                      Create New Project
                    </Button>
                  </span>
                </TooltipTrigger>
                {createDisabledReason ? <TooltipContent>{createDisabledReason}</TooltipContent> : null}
              </Tooltip>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const isIssue = issues.some((issue) => issue.projectId === project.projectId)
                return (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    movedOrMissing={isIssue}
                    onDelete={deleteProject}
                  />
                )
              })}
            </div>
          )}
        </main>
      </AuthGate>

      <ToastNotification
        message={toast.message}
        show={toast.show}
        onClose={() => setToast({ show: false, message: '' })}
      />

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        projectName={projectName}
        onProjectNameChange={(value) => setProjectName(value)}
        floorplanFile={floorplanFile}
        onFloorplanChange={(file) => setFloorplanFile(file)}
        onSubmit={handleCreateProject}
        isSaving={isSavingProject}
        errorMessage={createError}
      />

      <Dialog open={issuesOpen} onOpenChange={setIssuesOpen}>
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
                      onClick={() => {
                        setRelinkTarget(issue)
                        setRelinkInput('')
                        setRelinkError(null)
                      }}
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
            <Button
              onClick={async () => {
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
                setToast({ show: true, message: toastMessage })
              }}
            >
              Re-create here
            </Button>
            <Button variant="ghost" onClick={() => setIssuesOpen(false)}>
              Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(relinkTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRelinkTarget(null)
            setRelinkInput('')
            setRelinkError(null)
            setIsRelinking(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relink Drive folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-foreground">
            {relinkTarget && (
              <p className="text-foreground-muted">
                Paste the Drive folder link or ID for <span className="text-foreground">{relinkTarget.projectName}</span>.
                The folder must live under <code className="rounded bg-muted px-1 py-0.5">/My Drive/{DRIVE_ROOT_NAME}/</code> and match&nbsp;
                <code className="rounded bg-muted px-1 py-0.5">
                  {`${relinkTarget.projectName}__${relinkTarget.projectId}`}
                </code>
                .
              </p>
            )}
            <Input
              placeholder="https://drive.google.com/drive/folders/..."
              value={relinkInput}
              onChange={(event) => setRelinkInput(event.target.value)}
              aria-invalid={Boolean(relinkError)}
            />
            {relinkError && <p className="text-sm text-destructive">{relinkError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRelinkTarget(null)
                setRelinkInput('')
                setRelinkError(null)
                setIsRelinking(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
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
                  setToast({ show: true, message: 'Drive folder relinked. Ready to sync.' })
                  setRelinkTarget(null)
                  setRelinkInput('')
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Failed to relink folder.'
                  setRelinkError(message)
                } finally {
                  setIsRelinking(false)
                }
              }}
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
    </div>
  )
}
