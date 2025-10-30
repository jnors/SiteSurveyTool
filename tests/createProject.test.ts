import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/utils/image', () => ({
  compressImageToJpeg: vi.fn(),
}))

let compressImageToJpeg: any

import { db } from '@/lib/db'
import { createProjectRecord } from '@/lib/hooks/use-projects'
import { mapToUIProject } from '@/lib/mappers'

describe('createProjectRecord', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    vi.resetAllMocks()

    // grab the mocked export at runtime (no top-level await)
    const mod = await import('@/lib/utils/image')
    compressImageToJpeg = mod.compressImageToJpeg
  })

  it('maps pins for the selected floorplan and surfaces pin counts', async () => {
    const now = new Date().toISOString()
    await db.projects.add({ id: 'proj-1', name: 'Multi', createdAt: now, updatedAt: now })
    await db.floorplans.bulkAdd([
      {
        id: 'fp-1',
        projectId: 'proj-1',
        name: 'Ground',
        type: 'image/jpeg',
        width: 100,
        height: 100,
        localUri: 'data:image/jpeg;base64,AAA',
      },
      {
        id: 'fp-2',
        projectId: 'proj-1',
        name: 'Level 2',
        type: 'image/jpeg',
        width: 100,
        height: 100,
        localUri: 'data:image/jpeg;base64,AAA',
      },
    ])
    await db.pins.bulkAdd([
      {
        id: 'pin-1',
        floorplanId: 'fp-1',
        title: 'Pin Ground',
        note: '',
        xPct: 10,
        yPct: 20,
        updatedAt: now,
      },
      {
        id: 'pin-2',
        floorplanId: 'fp-2',
        title: 'Pin Level 2',
        note: '',
        xPct: 30,
        yPct: 40,
        updatedAt: now,
      },
    ])

    const project = await db.projects.get('proj-1')
    const floorplans = await db.floorplans.where('projectId').equals('proj-1').toArray()

    const uiProject = await mapToUIProject(project!, floorplans, { activeFloorplanId: 'fp-2' })

    expect(uiProject.activeFloorplanId).toBe('fp-2')
    expect(uiProject.pins).toHaveLength(1)
    expect(uiProject.pins[0]?.pinId).toBe('pin-2')
    expect(uiProject.floorplans.find((fp) => fp.floorplanId === 'fp-1')?.pinCount).toBe(1)
    expect(uiProject.floorplans.find((fp) => fp.floorplanId === 'fp-2')?.pinCount).toBe(1)
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
    const floorplans = await db.floorplans.where('projectId').equals(projectId).toArray()

    expect(project).toBeDefined()
    expect(floorplans).toHaveLength(1)

    const uiProject = await mapToUIProject(project!, floorplans)
    expect(uiProject.status).toBe('pending')
    expect(uiProject.activeFloorplanId).toBe(floorplans[0]?.id ?? null)
    expect(uiProject.floorplans[0]?.pinCount).toBe(0)
  })
})
