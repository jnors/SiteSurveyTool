import type { Project } from "./types"

export const fakeProjects: Project[] = [
  {
    projectId: "proj-1",
    name: "Albergaria Survey – Aveiro",
    lastSynced: "2025-10-20T14:32:00Z",
    status: "synced",
    floorplanUrl: "/architectural-floorplan-blueprint.jpg",
    pins: [
      {
        pinId: "pin-1",
        xPct: 40,
        yPct: 40,
        title: "HVAC Unit 1",
        note: "Check vibration isolation. Unit appears to be functioning normally but requires inspection of mounting brackets.",
        photos: [
          "/hvac-unit-industrial.jpg",
          "/hvac-mounting-bracket.jpg",
          "/hvac-control-panel.jpg",
          "/hvac-ventilation-duct.jpg",
        ],
        syncStatus: "pending",
      },
      {
        pinId: "pin-2",
        xPct: 72.5,
        yPct: 30,
        title: "Electrical Panel A",
        note: "Main distribution panel. All circuits labeled and functioning.",
        photos: [
          "/electrical-panel-breakers.jpg",
          "/industrial-electrical-wiring.png",
          "/circuit-breaker-panel.jpg",
          "/electrical-conduit.png",
        ],
        syncStatus: "synced",
      },
      {
        pinId: "pin-3",
        xPct: 56.25,
        yPct: 70,
        title: "Water Damage - NE Corner",
        note: "Visible water staining on ceiling. Requires immediate attention and source investigation.",
        photos: [
          "/water-damage-ceiling.jpg",
          "/ceiling-stain-leak.jpg",
          "/water-damage-wall.jpg",
          "/moisture-damage-building.jpg",
        ],
        syncStatus: "error",
      },
    ],
  },
  {
    projectId: "proj-2",
    name: "Porto Office Complex",
    lastSynced: "2025-10-19T09:15:00Z",
    status: "pending",
    floorplanUrl: "/office-building-floorplan.jpg",
    pins: [
      {
        pinId: "pin-4",
        xPct: 35,
        yPct: 53.3333,
        title: "Fire Suppression System",
        note: "Annual inspection due. System appears operational.",
        photos: [
          "/fire-sprinkler-system.jpg",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
        ],
        syncStatus: "pending",
      },
    ],
  },
  {
    projectId: "proj-3",
    name: "Lisbon Warehouse Retrofit",
    lastSynced: "2025-10-18T16:45:00Z",
    status: "error",
    floorplanUrl: "/placeholder.svg?height=800&width=1200",
    pins: [
      {
        pinId: "pin-5",
        xPct: 50,
        yPct: 50,
        title: "Loading Dock 3",
        note: "Hydraulic lift mechanism needs servicing.",
        photos: [
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
        ],
        syncStatus: "error",
      },
    ],
  },
  {
    projectId: "proj-4",
    name: "Coimbra University Lab",
    lastSynced: "2025-10-21T11:20:00Z",
    status: "syncing",
    floorplanUrl: "/placeholder.svg?height=800&width=1200",
    pins: [
      {
        pinId: "pin-6",
        xPct: 43.75,
        yPct: 41.6667,
        title: "Fume Hood Station 2",
        note: "Airflow test completed. Within acceptable parameters.",
        photos: [
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
          "/placeholder.svg?height=400&width=400",
        ],
        syncStatus: "syncing",
      },
    ],
  },
]
