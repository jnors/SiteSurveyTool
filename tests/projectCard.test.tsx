import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectCard } from '@/components/project-card'
import type { Project } from '@/lib/types'

function makeProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString()
  return {
    projectId: 'proj-1',
    name: 'Test Project',
    lastSynced: now,
    status: 'pending',
    activeFloorplanId: null,
    floorplans: [
      {
        floorplanId: 'fp-1',
        name: 'Main',
        localUri: 'data:image/jpeg;base64,AAA',
        width: 100,
        height: 100,
        driveFileId: undefined,
        pinCount: 2,
      },
    ],
    pins: [],
    syncAnomaly: null,
    ...overrides,
  }
}

describe('<ProjectCard />', () => {
  it('shows a Relink badge when the project has a moved anomaly', () => {
    render(<ProjectCard project={makeProject({ syncAnomaly: 'moved' })} />)
    expect(screen.getByText('Relink')).toBeInTheDocument()
  })

  it('shows a Re-create badge when the project has a missing anomaly', () => {
    render(<ProjectCard project={makeProject({ syncAnomaly: 'missing' })} />)
    expect(screen.getByText('Re-create')).toBeInTheDocument()
  })

  it('shows a Relink badge when ensure issues mark the project in-session', () => {
    render(<ProjectCard project={makeProject()} movedOrMissing />)
    expect(screen.getByText('Relink')).toBeInTheDocument()
  })
})
