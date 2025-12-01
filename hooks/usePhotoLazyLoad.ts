import { useEffect, useState } from 'react'
import { lazyLoadPhoto } from '@/lib/lazy-load-photo'
import type { PinPhoto } from '@/lib/types'

/**
 * Hook to lazy-load photos from Google Drive
 * Returns photo URIs, loading them in the background if needed
 */
export function usePhotoLazyLoad(photos: PinPhoto[]) {
    const [photoUris, setPhotoUris] = useState<Map<string, string>>(new Map())
    const [loading, setLoading] = useState<Set<string>>(new Set())

    useEffect(() => {
        // Find photos that need loading (empty localUri but have driveFileId)
        const photosToLoad = photos.filter(
            (photo) => !photo.localUri && photo.driveFileId && !loading.has(photo.photoId)
        )

        if (photosToLoad.length === 0) {
            return
        }

        // Mark as loading
        setLoading((prev) => {
            const next = new Set(prev)
            photosToLoad.forEach((photo) => next.add(photo.photoId))
            return next
        })

        // Load each photo
        photosToLoad.forEach(async (photo) => {
            try {
                const uri = await lazyLoadPhoto(photo.photoId)
                if (uri) {
                    setPhotoUris((prev) => {
                        const next = new Map(prev)
                        next.set(photo.photoId, uri)
                        return next
                    })
                }
            } finally {
                setLoading((prev) => {
                    const next = new Set(prev)
                    next.delete(photo.photoId)
                    return next
                })
            }
        })
    }, [photos, loading])

    // Return URIs for photos, using loaded URI if available, otherwise localUri or placeholder
    const getPhotoUri = (photo: PinPhoto): string => {
        const loadedUri = photoUris.get(photo.photoId)
        if (loadedUri) return loadedUri
        if (photo.localUri) return photo.localUri
        return '/placeholder.svg'
    }

    return { getPhotoUri, isLoading: (photoId: string) => loading.has(photoId) }
}
