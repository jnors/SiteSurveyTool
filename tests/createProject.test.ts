import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/utils/image', () => ({
  compressImageToJpeg: vi.fn(),
}))

const { compressImageToJpeg } = await import('@/lib/utils/image')

import { db } from '@/lib/db'
import { createProjectRecord } from '@/lib/hooks/use-projects'
import { mapToUIProject } from '@/lib/mappers'

describe('createProjectRecord', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    vi.resetAllMocks()
  })

  it('creates project and floorplan rows in Dexie', async () => {
    vi.mocked(compressImageToJpeg).mockResolvedValue({
      blob: new Blob(),
      dataUrl: 'data:image/jpeg;base64,AAA',
      width: 1024,
      height: 768,
      sizeBytes: 12345,
    })

    const file = new File(['demo'], 'floorplan.png', { type: 'image/png' })

    const { projectId } = await createProjectRecord({ name: 'Main Facility', file })

    const project = await db.projects.get(projectId)
    expect(project).toBeDefined()
    expect(project?.name).toBe('Main Facility')
    expect(project?.driveFolderId).toBeUndefined()

    const floorplan = await db.floorplans.where('projectId').equals(projectId).first()
    expect(floorplan).toBeDefined()
    expect(floorplan?.type).toBe('image/jpeg')
    expect(floorplan?.width).toBe(1024)
    expect(floorplan?.height).toBe(768)
    expect(floorplan?.localUri).toBe('data:image/jpeg;base64,AAA')

    expect(compressImageToJpeg).toHaveBeenCalledWith(file, 1080, 0.75)
  })

  it('maps new projects without Drive IDs to pending status', async () => {
    vi.mocked(compressImageToJpeg).mockResolvedValue({
      blob: new Blob(),
      dataUrl: 'data:image/jpeg;base64,BBB',
      width: 900,
      height: 600,
      sizeBytes: 9876,
    })

    const file = new File(['demo'], 'plan.jpg', { type: 'image/jpeg' })
    const { projectId } = await createProjectRecord({ name: 'Pending Site', file })

    const project = await db.projects.get(projectId)
    const floorplan = await db.floorplans.where('projectId').equals(projectId).first()

    expect(project).toBeDefined()
    expect(floorplan).toBeDefined()

    const uiProject = await mapToUIProject(project!, floorplan!)
    expect(uiProject.status).toBe('pending')
  })
})
