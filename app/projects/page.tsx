'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Loader2 } from '@/ui'

import { AuthGate, NavBar, OfflineBanner, ProjectCreateDialog, ProjectCard, SyncBar, ToastNotification, Button, useAuth, useOnline, useProjects } from '@/ui'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PricingModal } from '@/components/pricing-modal'
import { RestoreProgressOverlay } from '@/components/restore-progress-overlay'
import { SyncIssuesDialog } from '@/components/sync-issues-dialog'
import { RelinkDialog } from '@/components/relink-dialog'
import { useProjectSync } from '@/hooks/useProjectSync'
import { useProjectRestore } from '@/hooks/useProjectRestore'
import type { SyncStatus } from '@/core'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const { projects, isLoading, syncAll, recreateProjectFolder, relinkProjectFolder, createProject, deleteProject, refresh } = useProjects()
  const router = useRouter()
  const isOnline = useOnline()
  const auth = useAuth('/projects')

  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })
  const [createOpen, setCreateOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [createError, setCreateError] = useState<string | undefined>(undefined)

  const showToast = (message: string) => setToast({ show: true, message })

  const syncHook = useProjectSync({
    syncAll,
    recreateProjectFolder,
    relinkProjectFolder,
    onToast: showToast,
  })

  const restoreHook = useProjectRestore({
    isAuthenticated: auth.isAuthenticated,
    isLoading,
    projectCount: projects.length,
    isOnline,
    refresh,
    onToast: showToast,
  })

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
      showToast('Project created. Add pins and sync when ready.')
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

  const isPro = auth.subscriptionStatus === 'active'
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
          onSync={syncHook.handleSyncAll}
          disabledReason={syncDisabledReason}
          isSyncing={overallStatus === 'syncing'}
          onViewIssues={syncHook.issues.length ? () => syncHook.setIssuesOpen(true) : undefined}
        />

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-foreground-muted">Manage your site survey projects</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {!isPro && <PricingModal className="w-full sm:w-auto" />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex w-full sm:w-auto">
                    <Button
                      className="w-full gap-2 bg-primary hover:bg-primary-hover sm:w-auto"
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
                const isIssue = syncHook.issues.some((issue) => issue.projectId === project.projectId)
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

      <SyncIssuesDialog
        open={syncHook.issuesOpen}
        onOpenChange={syncHook.setIssuesOpen}
        issues={syncHook.issues}
        onRelink={syncHook.openRelinkDialog}
        onRecreate={syncHook.handleRecreate}
      />

      <RelinkDialog
        target={syncHook.relinkTarget}
        open={Boolean(syncHook.relinkTarget)}
        onOpenChange={(open) => {
          if (!open) syncHook.closeRelinkDialog()
        }}
        inputValue={syncHook.relinkInput}
        onInputChange={syncHook.setRelinkInput}
        error={syncHook.relinkError}
        isRelinking={syncHook.isRelinking}
        onSave={syncHook.handleRelink}
        onCancel={syncHook.closeRelinkDialog}
      />

      <RestoreProgressOverlay
        isRestoring={restoreHook.isRestoring}
        progress={restoreHook.restoreProgress}
      />
    </div>
  )
}
