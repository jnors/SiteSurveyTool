// Centralized app constants

export const GRID_SIZE = 8

// Branding colors (dark-mode first)
export const COLORS = {
  bg: '#020617', // Slate 950
  surface: '#0f172a', // Slate 900
  primary: '#3b82f6', // Blue 500
  success: '#22c55e', // Green 500
  warning: '#f59e0b', // Amber 500
  error: '#ef4444', // Red 500
  textPrimary: '#f8fafc', // Slate 50
}

import { env } from '@/lib/env'

// Photos
export const MAX_PHOTO_RES = env.NEXT_PUBLIC_MAX_PHOTO_RES
export const MAX_PHOTOS_PER_PIN = env.NEXT_PUBLIC_MAX_PHOTOS_PER_PIN

// Google Drive
export const DRIVE_ROOT_NAME = 'FieldPins'

