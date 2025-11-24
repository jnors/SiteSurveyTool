// Sync layer: Drive client/server helpers
// Client-side helpers
export {
  ensureProjectFolderClient,
  validateProjectFolderClient,
  uploadPhotoClient,
  uploadFloorplanClient,
  writeProjectJsonClient,
  deletePhotoClient,
} from '@/lib/google'

// Server-side token access (no React)
export { requireServerAccessToken, driveFetch, ensureChildFolder, findFileInFolder, uploadFileMultipart, deleteDriveFile, parseDataUrl, extensionFromMime, findFolderByName } from '@/lib/google-server'

