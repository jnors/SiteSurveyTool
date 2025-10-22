# Export JSON (project.json)

- Sprint 1: Local-only; Drive export is planned for Sprint 2.
- This document describes the structure that will be written to Drive under the project folder, with `project.json` written last.

## Structure
```
{
  "project": {
    "id": "<projectId>",
    "name": "<Project Name>",
    "syncedAt": "<ISO8601>",
    "driveFolderId": "<optional>"
  },
  "floorplan": {
    "id": "<floorplanId>",
    "projectId": "<projectId>",
    "name": "<Label>",
    "type": "image/jpeg|image/png",
    "width": <number>,
    "height": <number>,
    "driveFileId": "<optional>"
  },
  "pins": [
    {
      "id": "<pinId>",
      "floorplanId": "<floorplanId>",
      "title": "<Title>",
      "note": "<Note>",
      "xPct": <0..100>,
      "yPct": <0..100>,
      "updatedAt": "<ISO8601>",
      "photos": [
        {
          "id": "<photoId>",
          "pinId": "<pinId>",
          "width": <number>,
          "height": <number>,
          "sizeBytes": <number>,
          "driveFileId": "<optional>",
          "status": "synced|pending|error|syncing"
        }
      ]
    }
  ]
}
```

## Sequence (Sprint 2)
- Ensure `/My Drive/SST/` root folder exists.
- Ensure project folder named `<ProjectName>__<projectId>` exists.
- Upload photos first; capture `driveFileId`s.
- Upload floorplan image (optional), capture `driveFileId`.
- Write `project.json` last, reflecting all driveFileIds and current data.

## Notes
- Photos are capped at 4 per pin and stored at 1080p JPEG for reliability.
- Last-write-wins: Later edits overwrite prior JSON and metadata.

