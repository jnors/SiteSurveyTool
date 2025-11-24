import type { ProjectRow, FloorplanRow, PinRow, PhotoRow } from '@/lib/db'
import { ProjectSchema, FloorplanSchema, PinSchema, PhotoSchema, type ProjectDTO, type FloorplanDTO, type PinDTO, type PhotoDTO } from './schemas'

// Row -> DTO (validate)
export function toProjectDTO(row: ProjectRow): ProjectDTO {
  return ProjectSchema.parse({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    driveFolderId: row.driveFolderId,
    syncedAt: row.syncedAt,
    syncAnomaly: row.syncAnomaly ?? null,
  })
}

export function toFloorplanDTO(row: FloorplanRow): FloorplanDTO {
  return FloorplanSchema.parse({
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    type: row.type,
    width: row.width,
    height: row.height,
    localUri: row.localUri,
    driveFileId: row.driveFileId,
  })
}

export function toPinDTO(row: PinRow): PinDTO {
  return PinSchema.parse({
    id: row.id,
    floorplanId: row.floorplanId,
    title: row.title,
    note: row.note,
    xPct: row.xPct,
    yPct: row.yPct,
    updatedAt: row.updatedAt,
  })
}

export function toPhotoDTO(row: PhotoRow): PhotoDTO {
  return PhotoSchema.parse({
    id: row.id,
    pinId: row.pinId,
    localUri: row.localUri,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    driveFileId: row.driveFileId,
    status: row.status,
  })
}

// DTO -> Row (validate input first)
export function fromProjectDTO(dto: ProjectDTO): ProjectRow {
  const valid = ProjectSchema.parse(dto)
  return {
    id: valid.id,
    name: valid.name,
    createdAt: valid.createdAt,
    updatedAt: valid.updatedAt,
    driveFolderId: valid.driveFolderId,
    syncedAt: valid.syncedAt,
    syncAnomaly: valid.syncAnomaly ?? null,
  }
}

export function fromFloorplanDTO(dto: FloorplanDTO): FloorplanRow {
  const valid = FloorplanSchema.parse(dto)
  return {
    id: valid.id,
    projectId: valid.projectId,
    name: valid.name,
    type: valid.type,
    width: valid.width,
    height: valid.height,
    localUri: valid.localUri,
    driveFileId: valid.driveFileId,
  }
}

export function fromPinDTO(dto: PinDTO): PinRow {
  const valid = PinSchema.parse(dto)
  return {
    id: valid.id,
    floorplanId: valid.floorplanId,
    title: valid.title,
    note: valid.note,
    xPct: valid.xPct,
    yPct: valid.yPct,
    updatedAt: valid.updatedAt,
  }
}

export function fromPhotoDTO(dto: PhotoDTO): PhotoRow {
  const valid = PhotoSchema.parse(dto)
  return {
    id: valid.id,
    pinId: valid.pinId,
    localUri: valid.localUri,
    width: valid.width,
    height: valid.height,
    sizeBytes: valid.sizeBytes,
    driveFileId: valid.driveFileId,
    status: valid.status,
  }
}

