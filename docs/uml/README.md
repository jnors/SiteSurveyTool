SST UML Overview

This folder contains Mermaid-based UML diagrams modeling interactions between the UI, React components, local services, and external APIs (Google OAuth and Drive) for the Site Survey Tool (SST) MVP.

Scope and constraints reflected here:
- Next.js PWA, offline-first with Dexie/IndexedDB; manual sync only
- Google OAuth (openid email profile) + Google Drive scope; no backend DB
- Photo pipeline: max 4 photos per pin, resized to max 1080p JPEG
- Drive sync writes `project.json` last; exponential backoff on failures

Files:
- `docs/uml/sst-uml.md` – Component interactions and key sequence diagrams (Mermaid)
- PlantUML diagrams:
  - `docs/uml/plantuml/components.puml`
  - `docs/uml/plantuml/sequences-login-ensure.puml`
  - `docs/uml/plantuml/sequences-add-pin-photos.puml`
  - `docs/uml/plantuml/sequences-manual-sync.puml`
  - `docs/uml/plantuml/sequences-moved-relink.puml`
  - `docs/uml/plantuml/class-model.puml`

Notes:
- Mermaid diagrams preview in VS Code (Markdown Preview Mermaid Support) or GitHub.
- PlantUML can be rendered with the PlantUML extension or CLI (`plantuml *.puml`).
- Diagrams align with current repo code (NextAuth, Dexie, API routes) and AGENTS.md constraints.
