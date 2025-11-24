import { z } from 'zod'

// Shared enums
export const SyncStatus = z.enum(['synced', 'pending', 'error', 'syncing'])
export const SyncAnomaly = z.enum(['moved', 'missing'])

// Project
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  driveFolderId: z.string().min(1).optional(),
  syncedAt: z.string().min(1).optional(),
  syncAnomaly: SyncAnomaly.nullable().optional(),
})
export type ProjectDTO = z.infer<typeof ProjectSchema>

// Floorplan
export const FloorplanSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  localUri: z.string().min(1),
  driveFileId: z.string().min(1).optional(),
})
export type FloorplanDTO = z.infer<typeof FloorplanSchema>

// Pin
export const PinSchema = z.object({
  id: z.string().min(1),
  floorplanId: z.string().min(1),
  title: z.string().min(1),
  note: z.string().default(''),
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  updatedAt: z.string().min(1),
})
export type PinDTO = z.infer<typeof PinSchema>

// Photo
export const PhotoSchema = z.object({
  id: z.string().min(1),
  pinId: z.string().min(1),
  localUri: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  sizeBytes: z.number().nonnegative(),
  driveFileId: z.string().min(1).optional(),
  status: SyncStatus,
})
export type PhotoDTO = z.infer<typeof PhotoSchema>

// Outbox
export const OutboxSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  entityType: z.enum(['project', 'floorplan', 'pin', 'photo']),
  entityId: z.string().min(1),
  payload: z.unknown(),
  retries: z.number().int().nonnegative(),
  lastTriedAt: z.string().optional(),
})
export type OutboxDTO = z.infer<typeof OutboxSchema>

// Collections
export const ProjectListSchema = z.array(ProjectSchema)
export const FloorplanListSchema = z.array(FloorplanSchema)
export const PinListSchema = z.array(PinSchema)
export const PhotoListSchema = z.array(PhotoSchema)
export const OutboxListSchema = z.array(OutboxSchema)

