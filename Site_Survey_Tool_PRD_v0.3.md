# FieldPins — Product Requirements Document (PRD) v0.3

**Author:** João Silva  
**Date:** 31 Oct 2025  
**Version:** 0.4 (Naming changed)

---

## 🧩 Problem

Network Engineers and Site Surveyors waste time and lose context because floorplans, photos, and notes are spread across different tools. This causes friction during design, documentation, and reporting, leading to rework and poor traceability.

**Customer value:** faster and more organized site surveys.  
**Business value:** niche SaaS with clear ROI and low switching cost.  
**Risks:** unreliable connectivity in the field, OS limitations for offline storage/camera access.

---

## 🚀 High Level Approach

A **mobile-first web app (Next.js PWA)** that supports **offline data capture** (floorplan + pins + notes + photos), with **manual sync to Google Drive** for cloud persistence.  
Authentication and user identity handled via **Google OAuth** (initial sign-in required before capture; offline capture available thereafter).  
No backend database (Supabase dropped for MVP).

---

## 🎥 Narrative

**Today:** Engineers capture photos on phones, notes in separate apps, and floorplans in PDFs. Reconciliation takes hours.  
**With FieldPins:** Sign in with Google, upload a floorplan, add pins with notes and photos (max 4 photos per pin, 1080p), work online or offline, then press “Sync” to push structured data to Drive.  
Projects are easily accessible in Google Drive under `/My Drive/FieldPins/<ProjectName>/`.

---

## 🎯 Goals

| Priority | Goal | Type |
|-----------|------|------|
| 1️⃣ | Visual capture of survey info in one place | Functional |
| 2️⃣ | Reduce post-survey org time by 50% | Measurable |
| 3️⃣ | Reliable offline capture + manual sync | Functional |
| 4️⃣ | Zero-training UX (≤5s to add pin/photo) | Experience |

### Metrics

| Type | Metric | Target |
|------|---------|--------|
| **North Star** | Post-survey organization time | ↓ 50% |
| **Secondary** | Median time to add pin+photo | ≤ 5s |
| **Secondary** | % successful syncs (24h) | ≥ 90% |
| **Guardrail** | Crash rate | < 1% |
| **Guardrail** | Photo attach failure | < 2% |

---

## 🚫 Non-goals (MVP)

- No videos.  
- No geo-referencing or Google Maps.  
- No multi-user collaboration.  
- No PDF exports (JSON only).  
- No project templates or tags.

---

## 🧭 Solution Alignment

| Scope | Description |
|--------|--------------|
| **Auth** | Google OAuth only (`openid email profile`) |
| **Storage** | Google Drive (`https://www.googleapis.com/auth/drive`) |
| **Data** | Structured JSONs per project (`project.json`, `pins/`, `floorplans/`) |
| **Export** | JSON only |
| **Offline** | Dexie/IndexedDB local-first (available after initial sign-in) |
| **Sync** | Manual |
| **Backend** | None (no Supabase, no server) |

---

## 🔑 Key Features

### MVP Features

1. Project management (local create/rename/delete).  
2. Floorplan upload & viewer (zoom/pan, PNG/JPG).  
3. Pins: add/move/delete with `% coordinates`.  
4. Pin modal: title, note, up to 4 photos @1080p.  
5. Offline persistence via Dexie.  
6. Manual sync to Google Drive (`My Drive/FieldPins/<ProjectName>`).  
7. JSON export (local + Drive `project.json`).  
8. Google OAuth sign-in and token refresh.

### Future Considerations

- Team collaboration & role-based sharing.  
- PDF reports.  
- Native wrapper (Capacitor).  
- Offline auto-sync.  
- Supabase metadata DB (v2).

---

## 🧰 Key Flows

### 1. Login Flow

1. Tap “Sign in with Google.”  
2. Google OAuth → access token for scopes:  
   - `openid email profile`  
   - `https://www.googleapis.com/auth/drive`  
3. Store user info locally (id, email).  
4. Redirect to dashboard. Offline capture and `/projects` access are available only after this step completes at least once on the device.

### 2. Discover Projects

1. Query Drive for folder named “FieldPins.”  
2. If missing, prompt “Create FieldPins folder.”  
3. List subfolders (`mimeType=folder`) under FieldPins.  
4. For each, fetch `project.json` → build dashboard list.

### 3. Create Project

1. User taps “+ New Project.”  
2. Creates subfolder under `FieldPins/`.  
3. Initializes empty `project.json` locally.  
4. Navigates to floorplan upload screen.

### 4. Add Floorplan

1. Upload image (JPG/PNG).  
2. Store locally with ID and metadata.  
3. Render in viewer (zoom/pan).  
4. Save entry in local Dexie DB.

### 5. Add Pins & Notes

1. Tap to place pin on floorplan (x%, y%).  
2. Modal opens → enter title, note.  
3. Add up to **4 photos** (camera/file picker).  
4. Photos auto-compressed to **1080p JPEG** (quality 0.7–0.8).  
5. Local save immediate; mark “unsynced.”

### 6. Manual Sync

1. User taps “Sync now.”  
2. Check network & token validity.  
3. Ensure folder structure in Drive:  
   `/My Drive/FieldPins/<ProjectName>/floorplans/`, `/pins/` etc.  
4. Upload floorplans, then pins JSONs, then photos.  
5. Write/patch `project.json` (includes Drive fileIds).  
6. Mark local records as “synced.”

### 7. Export JSON

- User taps “Export JSON.”  
- App downloads combined JSON: project metadata, floorplans, pins (notes, photo refs).  

---

## ⚙️ Key Logic

| Rule | Description |
|------|--------------|
| Photo limit | 4 per pin |
| Photo resolution | 1080p max |
| Coordinate system | % of intrinsic image size |
| Sync type | Manual only |
| Conflict policy | Last-write-wins (by updatedAt) |
| Folder naming | `<ProjectName>__<projectId>` |
| Local autosave | On every edit or modal close |
| File format | JSON UTF-8 + JPEG |
| Offline persistence | Dexie + local URIs |
| Cloud structure | `My Drive/FieldPins/<Project>/<floorplans|pins>` |
| Auth storage | Local cache (Google ID, email) |

---

## 🚀 Launch Plan

| Phase | Goal | Deliverable | Exit Criteria |
|--------|------|--------------|----------------|
| **P1** | Local MVP | Projects, pins, photos, JSON export | Stable offline capture |
| **P2** | Google Drive Sync | OAuth + Drive uploads | 90% success rate |
| **P3** | Field Beta | 3–5 live surveys | No data loss |
| **P4** | Public MVP | Website + onboarding | 100+ users |

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|---------|-------------|
| OAuth app verification delay | Medium | Pilot in test mode first |
| iOS PWA camera quirks | Medium | Add Capacitor wrapper if needed |
| User moves FieldPins folder | Low | Detect and re-prompt folder ID |
| Network interruptions | High | Retry queue with exponential backoff |
| Drive quota | Low | User-managed; warn if upload fails |

---

## 🏁 Key Milestones

| Milestone | Owner | ETA | Notes |
|------------|--------|------|-------|
| Wireframes & UX | Design | Week 1 | Mobile-first |
| Floorplan viewer | Dev | Week 2–3 | Konva canvas |
| Notes & Photos | Dev | Week 3–4 | 1080p compression |
| Local DB + JSON export | Dev | Week 4 | Dexie schema |
| Google Auth + Sync | Dev | Week 5–6 | Drive API integration |
| Field Beta | PM | Week 7 | Test real surveys |
| Public MVP | PM | Week 8 | Go-live |

---

## 📦 Data Model (local Dexie)

\`\`\`
Project { id, name, createdAt, updatedAt, driveFolderId?, syncedAt? }
Floorplan { id, projectId, name, type, width, height, localUri, driveFileId? }
Pin { id, floorplanId, title, note, xPct, yPct, updatedAt }
Photo { id, pinId, localUri, width, height, sizeBytes, driveFileId?, status }
Outbox { id, kind, entityType, entityId, payload, retries, lastTriedAt }
\`\`\`

### Export Schema (`project.json`)
\`\`\`
{
  "schemaVersion": "1.0",
  "appVersion": "MVP",
  "project": { "id", "name", "createdAt", "updatedAt" },
  "floorplans": [ { "id", "name", "width", "height", "driveFileId" } ],
  "pins": [
    {
      "id": "...",
      "floorplanId": "...",
      "title": "...",
      "note": "...",
      "xPct": 0.5,
      "yPct": 0.25,
      "photos": [
        { "id": "...", "driveFileId": "...", "width": 1920, "height": 1080 }
      ]
    }
  ]
}
\`\`\`

---

## 🔐 Google Integration Details

**Scopes**
\`\`\`
openid email profile
https://www.googleapis.com/auth/drive
\`\`\`

**Auth flow**
- Sign in with Google → get access token.  
- Token stored locally; refreshed silently if possible.  
- User info retrieved via `userinfo` endpoint for display.

**Drive queries**
\`\`\`sql
# Find FieldPins folder
name = 'FieldPins' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false

# List projects
'${fieldpinsFolderId}' in parents and mimeType='application/vnd.google-apps.folder'
\`\`\`

**Upload sequence**
1. Ensure FieldPins root folder.  
2. Ensure project folder.  
3. Upload floorplans.  
4. Upload pins and photos.  
5. Write project.json.

---

## ✅ Final Design Decisions

| Topic | Decision |
|--------|-----------|
| Auth | Google OAuth only |
| Storage | Google Drive in user's My Drive |
| Offline-first | Yes (Dexie) |
| Sync | Manual only |
| Export | JSON only |
| Photos | Max 4 @1080p |
| Videos | Not supported |
| Backend | None |
| Limits | No enforced caps (user-managed Drive) |
| PDF | Not supported |

---

## 🔄 Next Steps

- Implement Dexie schemas + Drive API client.  
- Build “Sync now” and “Retry failed uploads.”  
- Add local-storage health indicator.  
- Prepare OAuth consent screen + branding for Google verification.  
- Build minimal landing/docs for MVP onboarding.

---
