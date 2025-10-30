import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'

vi.mock('@/lib/seed', () => ({
  seedIfEmpty: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils/image', () => ({
  compressImageToJpeg: vi.fn(),
}))

vi.mock('@/lib/google', async () => {
  const actual = await vi.importActual<typeof import('@/lib/google')>('@/lib/google')
  return {
    ...actual,
    ensureProjectFolderClient: vi.fn(),
  }
})

vi.mock('@/lib/sync', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sync')>('@/lib/sync')
  return {
    ...actual,
    syncProject: vi.fn(),
  }
})

import { db } from '@/lib/db'
import { useProjects } from '@/lib/hooks/use-projects'
import type { EnsureFoldersResponse } from '@/lib/google'
import type { ProjectSyncSummary } from '@/lib/sync'
import type { SyncStatus } from '@/lib/types'
import type { compressImageToJpeg as CompressImageFn } from '@/lib/utils/image'
import type { ensureProjectFolderClient as EnsureProjectFn } from '@/lib/google'
import type { syncProject as SyncProjectFn } from '@/lib/sync'

let compressImageToJpeg: MockedFunction<CompressImageFn>
let ensureProjectFolderClient: MockedFunction<EnsureProjectFn>
let syncProject: MockedFunction<SyncProjectFn>

beforeAll(async () => {
  compressImageToJpeg = vi.mocked((await import('@/lib/utils/image')).compressImageToJpeg)
  ensureProjectFolderClient = vi.mocked((await import('@/lib/google')).ensureProjectFolderClient)
  syncProject = vi.mocked((await import('@/lib/sync')).syncProject)
})

function useTrackedProjects(
  onChange: (value: ReturnType<typeof useProjects>) => void,
): ReturnType<typeof useProjects> {
  const value = useProjects()
  useEffect(() => {
    onChange(value)
  }, [onChange, value.projects, value.ensureIssues])
  return value
}

describe('useProjects', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await db.delete()
  })

  it('creates a project and surfaces it as pending', async () => {
    compressImageToJpeg.mockResolvedValue({
      blob: new Blob(),
      dataUrl: 'data:image/jpeg;base64,AAA',
      width: 900,
      height: 600,
      sizeBytes: 12345,
    })

    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File(['floorplan'], 'site.png', { type: 'image/png' })

    let createdId: string
    await act(async () => {
      createdId = await result.current.createProject({ name: 'New Site', file })
    })

    await waitFor(() => expect(result.current.projects.length).toBe(1))

    const createdProject = result.current.projects[0]
    expect(createdProject?.projectId).toBe(createdId!)
    expect(createdProject?.status).toBe('pending')
    expect(createdProject?.floorplans).toHaveLength(1)
  })

  it('syncs all projects and updates drive folder IDs', async () => {
    const now = new Date().toISOString()
    await db.projects.add({
      id: 'proj-1',
      name: 'Existing Project',
      createdAt: now,
      updatedAt: now,
      syncedAt: now,
      driveFolderId: 'drive-old',
      syncAnomaly: null,
    })
    await db.floorplans.add({
      id: 'fp-1',
      projectId: 'proj-1',
      name: 'Main Floor',
      type: 'image/jpeg',
      width: 1024,
      height: 768,
      localUri: 'data:image/jpeg;base64,AAA',
      driveFileId: 'drive-floor',
    })

    const ensureResponse: EnsureFoldersResponse = {
      rootId: 'root-1',
      projectFolderId: 'drive-new',
      created: {},
      movedOrMissing: false,
    }
    ensureProjectFolderClient.mockResolvedValue(ensureResponse)

    const summary: ProjectSyncSummary = {
      projectId: 'proj-1',
      projectName: 'Existing Project',
      photoStats: { total: 0, success: 0, failed: 0 },
      floorplanUploaded: true,
      projectJsonWritten: true,
      errors: [],
    }
    syncProject.mockImplementation(async () => {
      await Promise.resolve()
      await db.projects.update('proj-1', { syncedAt: now })
      return summary
    })

    const statusSnapshots: SyncStatus[][] = []
    const trackStatuses = (value: ReturnType<typeof useProjects>) => {
      statusSnapshots.push(value.projects.map((project) => project.status))
    }

    const { result } = renderHook(({ onChange }) => useTrackedProjects(onChange), {
      initialProps: { onChange: trackStatuses },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.projects).toHaveLength(1)

    let syncResult: Awaited<ReturnType<typeof result.current.syncAll>>
    await act(async () => {
      syncResult = await result.current.syncAll()
    })

    expect(syncResult!.ensured).toBe(1)
    expect(syncResult!.movedOrMissing).toHaveLength(0)
    expect(syncResult!.errors).toBe(0)
    expect(syncResult!.projectSummaries).toEqual([summary])

    await waitFor(() => expect(result.current.projects[0]?.status).toBe('synced'))
    expect(result.current.ensureIssues).toHaveLength(0)
    expect(statusSnapshots.some((statuses) => statuses.every((status) => status === 'syncing'))).toBe(true)

    expect(ensureProjectFolderClient).toHaveBeenCalledWith({
      projectId: 'proj-1',
      projectName: 'Existing Project',
      driveFolderId: 'drive-old',
    })
    expect(syncProject).toHaveBeenCalledWith('proj-1', 'drive-new')

    const projectRow = await db.projects.get('proj-1')
    expect(projectRow?.driveFolderId).toBe('drive-new')
  })

  it('records moved anomalies during syncAll', async () => {
    const now = new Date().toISOString()
    await db.projects.add({
      id: 'proj-2',
      name: 'Moved Project',
      createdAt: now,
      updatedAt: now,
      syncedAt: now,
      driveFolderId: 'drive-stale',
      syncAnomaly: null,
    })
    await db.floorplans.add({
      id: 'fp-2',
      projectId: 'proj-2',
      name: 'Roof Plan',
      type: 'image/jpeg',
      width: 2048,
      height: 1024,
      localUri: 'data:image/jpeg;base64,BBB',
      driveFileId: 'drive-floor',
    })

    ensureProjectFolderClient.mockResolvedValue({
      rootId: 'root-1',
      projectFolderId: 'drive-relocated',
      created: {},
      movedOrMissing: true,
      anomaly: 'moved',
    })

    const summary: ProjectSyncSummary = {
      projectId: 'proj-2',
      projectName: 'Moved Project',
      photoStats: { total: 0, success: 0, failed: 0 },
      floorplanUploaded: true,
      projectJsonWritten: true,
      errors: [],
    }
    syncProject.mockResolvedValue(summary)

    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let syncResult: Awaited<ReturnType<typeof result.current.syncAll>>
    await act(async () => {
      syncResult = await result.current.syncAll()
    })

    expect(syncResult!.ensured).toBe(1)
    expect(syncResult!.movedOrMissing).toHaveLength(1)
    expect(syncResult!.movedOrMissing[0]).toMatchObject({ projectId: 'proj-2', projectName: 'Moved Project' })

    await waitFor(() => expect(result.current.ensureIssues).toHaveLength(1))
    expect(result.current.ensureIssues[0]?.projectId).toBe('proj-2')
    expect(result.current.projects[0]?.syncAnomaly).toBe('moved')

    const projectRow = await db.projects.get('proj-2')
    expect(projectRow?.syncAnomaly).toBe('moved')
  })
})
