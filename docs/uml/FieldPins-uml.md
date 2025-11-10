FieldPins UML — UI, React Components, and External Services

This document captures how the FieldPins Next.js PWA interacts across the UI, React components, client-side services, and external Google APIs, within the MVP constraints (manual sync, no backend DB, offline-first).

Component Interaction Diagram

```mermaid
flowchart LR
  %% UI / React components (actual components in repo)
  subgraph UI[UI / React Components]
    AppShell[App Layout/providers]
    ProjectsPage[ProjectsPage]
    ProjectDetailPage[ProjectDetailPage]
    FloorplanViewer[Floorplan Viewer]
    PinDetailModal[PinDetailModal]
    PinSidebar[PinSidebar]
    PinMarker[PinMarker]
    SyncBanner[SyncBanner]
    OfflineBanner[OfflineBanner]
    NavBar[NavBar]
    SignInCard[SignInCard]
    SWReg[ServiceWorkerRegistrar]
  end

  %% Client-side services
  subgraph SVC[Client Services]
    Dexie[Dexie / IndexedDB]
    Outbox[Outbox Table]
    AuthClient[NextAuth client]
    GoogleClient[Drive Client wrappers]
    SyncProcessor[syncProject]
    PhotoPipeline[compressImageToJpeg 1080p JPEG]
    SW[Service Worker / Cache]
  end

  %% Next.js API routes (server edge)
  subgraph API[Next.js API Routes]
    EnsureAPI[api/drive/ensure]
    RelinkAPI[api/drive/relink]
    UploadPhotoAPI[api/drive/upload/photo]
    UploadFloorplanAPI[api/drive/upload/floorplan]
    ProjectJsonAPI[api/drive/write/project-json]
    DeletePhotoAPI[api/drive/delete/photo]
  end

  %% External APIs
  subgraph EXT[External Services]
    GoogleOAuth[Google OAuth]
    GoogleDrive[Google Drive API]
  end

  %% Auth
  AppShell --> AuthClient
  AuthClient --> GoogleOAuth

  %% Data access / UI interactions
  ProjectsPage <--> Dexie
  ProjectDetailPage <--> Dexie
  FloorplanViewer <--> Dexie
  PinDetailModal --> Dexie
  PinDetailModal --> PhotoPipeline
  PhotoPipeline --> Dexie
  PinSidebar --> Dexie

  %% Outbox & sync
  PinDetailModal --> Outbox
  SyncBanner --> SyncProcessor
  SyncProcessor <--> Outbox
  SyncProcessor --> GoogleClient
  SyncProcessor --> Dexie

  %% Client -> API
  GoogleClient --> EnsureAPI
  GoogleClient --> RelinkAPI
  GoogleClient --> UploadPhotoAPI
  GoogleClient --> UploadFloorplanAPI
  GoogleClient --> ProjectJsonAPI
  GoogleClient --> DeletePhotoAPI

  %% API -> Google
  EnsureAPI --> GoogleDrive
  RelinkAPI --> GoogleDrive
  UploadPhotoAPI --> GoogleDrive
  UploadFloorplanAPI --> GoogleDrive
  ProjectJsonAPI --> GoogleDrive
  DeletePhotoAPI --> GoogleDrive

  %% UX signals
  SW --- SWReg
  SW --- ProjectsPage
  SW --- ProjectDetailPage
  ProjectsPage --> OfflineBanner
  ProjectDetailPage --> OfflineBanner
```

Data Model Snapshot (for reference)

```mermaid
classDiagram
  class Project {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    driveFolderId?: string
    syncedAt?: string
    syncAnomaly?: "moved"|"missing"|null
  }
  class Floorplan {
    id: string
    projectId: string
    name: string
    type: string
    width: number
    height: number
    localUri: string
    driveFileId?: string
  }
  class Pin {
    id: string
    floorplanId: string
    title: string
    note: string
    xPct: number
    yPct: number
    updatedAt: string
  }
  class Photo {
    id: string
    pinId: string
    localUri: string
    width: number
    height: number
    sizeBytes: number
    driveFileId?: string
    status: "pending"|"synced"|"error"|"syncing"
  }
  class Outbox {
    id: string
    kind: string
    entityType: "project"|"floorplan"|"pin"|"photo"
    entityId: string
    payload: any
    retries: number
    lastTriedAt?: string
  }

  Project "1" --> "*" Floorplan
  Floorplan "1" --> "*" Pin
  Pin "1" --> "*" Photo
```

Sequence — Login + Drive Root Setup

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant App as NextAuth client
  participant GO as Google OAuth
  participant API as /api/drive/ensure
  participant GD as Google Drive API
  participant DB as Dexie

  U->>App: Open app / Sign In
  App->>GO: OAuth with Drive scope
  GO-->>App: Access token (JWT session)

  Note over App: On sync or first ensure
  App->>API: ensureProjectFolder(projectId,name,driveFolderId?)
  API->>GD: Ensure /My Drive/FieldPins
  GD-->>API: Root folder ID
  API->>GD: Ensure ProjectName__projectId
  GD-->>API: Project folder ID
  API-->>App: { rootId, projectFolderId, movedOrMissing? }
  App->>DB: Save/Update driveFolderId
```

Sequence — Add Pin + Photos (Offline First)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FP as Floorplan Viewer
  participant Modal as PinDetailModal
  participant PP as PhotoPipeline
  participant DB as Dexie
  participant OB as Outbox

  U->>FP: Tap to add pin (xPct,yPct)
  FP->>Modal: Open modal (title, note)
  U->>Modal: Enter details
  U->>Modal: Attach up to 4 photos
  Modal->>PP: compressImageToJpeg(1080, q=0.75)
  PP->>DB: Add Photo{ localUri, dims, sizeBytes, status=pending }
  Modal->>DB: Add Pin{...}
  Modal->>OB: enqueue upload_photo per photo
```

Sequence — Manual Sync (Outbox Processing)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant SB as SyncBanner
  participant Sync as syncProject()
  participant OB as Outbox
  participant API as API routes
  participant GD as Google Drive API
  participant DB as Dexie

  U->>SB: Tap "Sync now"
  SB->>Sync: start
  loop Photos to upload
    Sync->>DB: Read pending photos
    Sync->>API: /upload/photo (multipart)
    API->>GD: files.create or update
    GD-->>API: fileId
    API-->>Sync: ok
    Sync->>DB: Update Photo{ driveFileId, status=synced }
    Sync->>OB: Remove outbox entries for photo
    alt Delete pending
      Sync->>API: /delete/photo
      API->>GD: files.delete
      GD-->>API: ok/404
      API-->>Sync: deleted
      Sync->>OB: Mark delete done
    end
  end
  opt Demo normalization (NEXT_PUBLIC_DEMO_SYNC=1)
    Sync->>DB: Set remaining photo.status = synced
    Sync->>OB: Clear lingering photo outbox rows
    Sync->>DB: Update Project.syncedAt
  end
  Sync->>DB: Gather project data
  Sync->>API: /write/project-json (write last)
  API->>GD: files.create/update project.json
  GD-->>API: fileId
  API-->>Sync: ok
  Sync->>DB: Update Project.syncedAt
```

Sequence — Moved/Renamed Drive Folder (Detect, Re-create, Relink)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant Projects as ProjectsPage
  participant Hook as useProjects()
  participant Ensure as /api/drive/ensure
  participant Relink as /api/drive/relink
  participant GD as Google Drive API
  participant DB as Dexie

  U->>Projects: Tap "Sync now"
  Projects->>Hook: syncAll()
  loop for each project
    Hook->>Ensure: ensureProjectFolder(projectId,name,driveFolderId)
    Ensure->>GD: verify cached folder (if provided)
    GD-->>Ensure: anomaly = moved|missing or ok
    Ensure-->>Hook: { projectFolderId, movedOrMissing, anomaly }
    alt movedOrMissing
      Hook->>DB: set Project.syncAnomaly = moved|missing
      Hook-->>Projects: show issues dialog
    else ok
      Hook->>DB: update driveFolderId if changed, clear syncAnomaly
    end
  end

  alt User chooses Re-create here
    Projects->>Hook: recreateProjectFolder(projectId)
    Hook->>Ensure: ensureProjectFolder(projectId,name)
    Ensure->>GD: create folder under /My Drive/FieldPins
    GD-->>Ensure: new folder id
    Ensure-->>Hook: { projectFolderId }
    Hook->>DB: update driveFolderId, reset floorplan.driveFileId, photo.driveFileId, status=pending, enqueue uploads
  else User chooses Relink and pastes link/ID
    Projects->>Hook: relinkProjectFolder(projectId, folderInput)
    Hook->>Relink: validateProjectFolder(projectId,name,folderInput)
    Relink->>GD: fetch folder, validate parent/name/ownership
    GD-->>Relink: ok + folderId (or errors)
    Relink-->>Hook: { folderId }
    Hook->>Ensure: ensureProjectFolder(projectId,name,folderId)
    Ensure-->>Hook: { movedOrMissing: false }
    Hook->>DB: update driveFolderId, clear syncAnomaly
  end
```

Sequence — Floorplan Viewer (Load & Render)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant PD as ProjectDetailPage
  participant FV as Floorplan Viewer
  participant DB as Dexie
  participant SW as Service Worker/Cache

  U->>PD: Open project / floorplan
  PD->>FV: Mount viewer
  FV->>DB: Read Floorplan + Pins (+ Photos.localUri)
  SW-->>PD: Cached shell/assets/images (if available)
  FV-->>U: Render image and pins (xPct,yPct)
```

Notes and Assumptions
- No backend database; all data is client-side with Dexie/IndexedDB.
- Manual sync only; no auto-sync. User initiates via SyncBanner.
- Google scopes: `openid email profile https://www.googleapis.com/auth/drive` via NextAuth; tokens live in session (JWT) client-accessible for API calls.
- Photo pipeline enforces max 4 photos per pin and max 1080p JPEG.
- Drive layout: `/My Drive/FieldPins/<ProjectName>__<projectId>/`; `project.json` is written last.
- Moved/renamed/missing folders surface as `syncAnomaly` and are resolved via Re-create or Relink flows.
