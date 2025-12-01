import { db } from '@/lib/db'
import { downloadFileClient } from '@/lib/google'
import { logger } from '@/lib/logger'

/**
 * Lazy-load a photo's image data from Google Drive if not already loaded
 * @param photoId - The ID of the photo to load
 * @returns The data URL of the photo, or empty string if it fails
 */
export async function lazyLoadPhoto(photoId: string): Promise<string> {
    try {
        // Get the photo from database
        const photo = await db.photos.get(photoId)

        if (!photo) {
            logger.warn('[lazyLoadPhoto] Photo not found in database', { photoId })
            return ''
        }

        // If localUri already exists, return it
        if (photo.localUri) {
            return photo.localUri
        }

        // If no driveFileId, can't download
        if (!photo.driveFileId) {
            logger.warn('[lazyLoadPhoto] Photo has no driveFileId', { photoId })
            return ''
        }

        // Download from Drive
        logger.info('[lazyLoadPhoto] Downloading photo from Drive', { photoId, driveFileId: photo.driveFileId })
        const { dataUrl } = await downloadFileClient({ fileId: photo.driveFileId })

        // Update database with the downloaded image
        await db.photos.update(photoId, { localUri: dataUrl })

        logger.info('[lazyLoadPhoto] Photo loaded and cached', { photoId })
        return dataUrl
    } catch (error) {
        logger.error('[lazyLoadPhoto] Failed to load photo', error, { photoId })
        return ''
    }
}

/**
 * Get the photo URI, lazy-loading from Drive if necessary
 * This is a synchronous wrapper that returns the current URI immediately
 * and triggers lazy-loading in the background if needed
 */
export function getPhotoUri(photo: { photoId: string; localUri: string; driveFileId?: string }): string {
    // If we have a localUri, return it immediately
    if (photo.localUri) {
        return photo.localUri
    }

    // If we have a driveFileId, trigger lazy-load in background
    if (photo.driveFileId) {
        lazyLoadPhoto(photo.photoId).catch((error) => {
            logger.error('[getPhotoUri] Background lazy-load failed', error, { photoId: photo.photoId })
        })
    }

    // Return placeholder for now
    return '/placeholder.svg'
}
