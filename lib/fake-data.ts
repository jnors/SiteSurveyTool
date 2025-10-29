import type { Project, SyncStatus } from './types'

function seedPhoto(pinId: string, index: number, localUri: string, status: SyncStatus) {
  return {
    photoId: `${pinId}-ph-${index}`,
    localUri,
    width: 0,
    height: 0,
    sizeBytes: 0,
    status,
  }
}

export const fakeProjects: Project[] = [
  {
    projectId: 'proj-1',
    name: 'Albergaria Survey – Aveiro',
    lastSynced: '2025-10-20T14:32:00Z',
    status: 'synced',
    activeFloorplanId: 'fp-proj-1',
    syncAnomaly: null,
    floorplans: [
      {
        floorplanId: 'fp-proj-1',
        name: 'Ground Floor',
        localUri: '/architectural-floorplan-blueprint.jpg',
        width: 0,
        height: 0,
        pinCount: 3,
      },
    ],
    pins: [
      {
        pinId: 'pin-1',
        xPct: 40,
        yPct: 40,
        title: 'HVAC Unit 1',
        note: 'Check vibration isolation. Unit appears to be functioning normally but requires inspection of mounting brackets.',
        photos: [
          seedPhoto('pin-1', 1, '/hvac-unit-industrial.jpg', 'pending'),
          seedPhoto('pin-1', 2, '/hvac-mounting-bracket.jpg', 'pending'),
          seedPhoto('pin-1', 3, '/hvac-control-panel.jpg', 'pending'),
          seedPhoto('pin-1', 4, '/hvac-ventilation-duct.jpg', 'pending'),
        ],
        syncStatus: 'pending',
      },
      {
        pinId: 'pin-2',
        xPct: 72.5,
        yPct: 30,
        title: 'Electrical Panel A',
        note: 'Main distribution panel. All circuits labeled and functioning.',
        photos: [
          seedPhoto('pin-2', 1, '/electrical-panel-breakers.jpg', 'synced'),
          seedPhoto('pin-2', 2, '/industrial-electrical-wiring.png', 'synced'),
          seedPhoto('pin-2', 3, '/circuit-breaker-panel.jpg', 'synced'),
          seedPhoto('pin-2', 4, '/electrical-conduit.png', 'synced'),
        ],
        syncStatus: 'synced',
      },
      {
        pinId: 'pin-3',
        xPct: 56.25,
        yPct: 70,
        title: 'Water Damage - NE Corner',
        note: 'Visible water staining on ceiling. Requires immediate attention and source investigation.',
        photos: [
          seedPhoto('pin-3', 1, '/water-damage-ceiling.jpg', 'error'),
          seedPhoto('pin-3', 2, '/ceiling-stain-leak.jpg', 'error'),
          seedPhoto('pin-3', 3, '/water-damage-wall.jpg', 'error'),
          seedPhoto('pin-3', 4, '/moisture-damage-building.jpg', 'error'),
        ],
        syncStatus: 'error',
      },
    ],
  },
  {
    projectId: 'proj-2',
    name: 'Porto Office Complex',
    lastSynced: '2025-10-19T09:15:00Z',
    status: 'pending',
    activeFloorplanId: 'fp-proj-2',
    syncAnomaly: null,
    floorplans: [
      {
        floorplanId: 'fp-proj-2',
        name: 'Level 2',
        localUri: '/office-building-floorplan.jpg',
        width: 0,
        height: 0,
        pinCount: 1,
      },
    ],
    pins: [
      {
        pinId: 'pin-4',
        xPct: 35,
        yPct: 53.3333,
        title: 'Fire Suppression System',
        note: 'Annual inspection due. System appears operational.',
        photos: [
          seedPhoto('pin-4', 1, '/fire-sprinkler-system.jpg', 'pending'),
          seedPhoto('pin-4', 2, '/placeholder.svg?height=400&width=400', 'pending'),
          seedPhoto('pin-4', 3, '/placeholder.svg?height=400&width=400', 'pending'),
          seedPhoto('pin-4', 4, '/placeholder.svg?height=400&width=400', 'pending'),
        ],
        syncStatus: 'pending',
      },
    ],
  },
  {
    projectId: 'proj-3',
    name: 'Lisbon Warehouse Retrofit',
    lastSynced: '2025-10-18T16:45:00Z',
    status: 'error',
    activeFloorplanId: 'fp-proj-3',
    syncAnomaly: null,
    floorplans: [
      {
        floorplanId: 'fp-proj-3',
        name: 'Main Warehouse',
        localUri: '/placeholder.svg?height=800&width=1200',
        width: 0,
        height: 0,
        pinCount: 1,
      },
    ],
    pins: [
      {
        pinId: 'pin-5',
        xPct: 50,
        yPct: 50,
        title: 'Loading Dock 3',
        note: 'Hydraulic lift mechanism needs servicing.',
        photos: [
          seedPhoto('pin-5', 1, '/placeholder.svg?height=400&width=400', 'error'),
          seedPhoto('pin-5', 2, '/placeholder.svg?height=400&width=400', 'error'),
          seedPhoto('pin-5', 3, '/placeholder.svg?height=400&width=400', 'error'),
          seedPhoto('pin-5', 4, '/placeholder.svg?height=400&width=400', 'error'),
        ],
        syncStatus: 'error',
      },
    ],
  },
  {
    projectId: 'proj-4',
    name: 'Coimbra University Lab',
    lastSynced: '2025-10-21T11:20:00Z',
    status: 'syncing',
    activeFloorplanId: 'fp-proj-4',
    syncAnomaly: null,
    floorplans: [
      {
        floorplanId: 'fp-proj-4',
        name: 'Lab Wing',
        localUri: '/placeholder.svg?height=800&width=1200',
        width: 0,
        height: 0,
        pinCount: 1,
      },
    ],
    pins: [
      {
        pinId: 'pin-6',
        xPct: 43.75,
        yPct: 41.6667,
        title: 'Fume Hood Station 2',
        note: 'Airflow test completed. Within acceptable parameters.',
        photos: [
          seedPhoto('pin-6', 1, '/placeholder.svg?height=400&width=400', 'syncing'),
          seedPhoto('pin-6', 2, '/placeholder.svg?height=400&width=400', 'syncing'),
          seedPhoto('pin-6', 3, '/placeholder.svg?height=400&width=400', 'syncing'),
          seedPhoto('pin-6', 4, '/placeholder.svg?height=400&width=400', 'syncing'),
        ],
        syncStatus: 'syncing',
      },
    ],
  },
]
